import fs from 'fs';
import path from 'path';
import * as xlsx from 'xlsx';
import { google } from 'googleapis';
import * as Stream from 'stream';
import ExcelJS from 'exceljs';

const BASE_FOLDER = path.resolve('PROJETO_SIA_ECONOMIA/INOVAÇÃO');

const JSON_FILE_NAME = 'documents.json';

const oAuth2Client = new google.auth.OAuth2({
    clientId: '255256262245-2gfrra6riq4fi62ba0lmembsf8org4dt.apps.googleusercontent.com',
    clientSecret: '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',
    redirectUri: 'https://localhost'

});

oAuth2Client.setCredentials({
    refresh_token: '1//04vZU2mg9cvNDCgYIARAAGAQSNwF-L9IrNgidZJba7iTybGGv-8HJWxrAoIulXfiQOJ5wfhheBqDk0CeQSUa_RDt1T_FyESLTT6M',
    access_token: 'ya29.a0AeDClZB5_RinKBVN-HiQ4EICLm83kz5SLlPaIJmMDulbcrrFmDIcp6QpU0HvzXOM_RAuolFMSC1fLnsMmJaCBiW3COheCKJMU2Gty5oJaqzVucod3xXx_r7zNKAjhpiwyoXBvkXH4ocM-DDRWncYD9wME-g_5Bi7mTiXaBmnaCgYKAegSAQ4SFQHGX2MiDzIKHuJi8TDw9EAbv0tDsQ0175',
    scope: 'https://www.googleapis.com/auth/drive',
});

// Configurações do Google Drive
const drive = google.drive({ version: 'v3', auth: oAuth2Client });
export async function main() {
    try {
        // Obtém os dados da planilha como array de objetos
        const spreadsheetData = await parseSpreadsheet();

        // Pega os anos (2019-2023)
        for (let year = 2019; year <= 2024; year++) {
            const yearFolder = path.join(BASE_FOLDER, String(year));

            // Lê todos os arquivos PDF na pasta do ano
            const files = fs.readdirSync(yearFolder).filter(file => file.endsWith('.pdf'));

            // Itera sobre cada arquivo PDF na pasta do ano
            for (const fileName of files) {
                const filePath = path.join(yearFolder, fileName);
                const fileContent = fs.readFileSync(filePath); // Lê o conteúdo do PDF
                const fileMetadata = await extractMetadata(fileName, spreadsheetData);

                if (fileMetadata) {

                    const response = await drive.files.create({
                        requestBody: { name: fileName },
                        media: {
                            mimeType: 'application/pdf',
                            body: Stream.Readable.from(fileContent),
                        },
                        fields: 'id, webViewLink',
                    });

                    const { title, authors, location, date, tags, description } = fileMetadata;

                    const newDocument = {
                        id: response.data.id,
                        title,
                        author: authors.split(','),
                        location,
                        date,
                        tags: tags.split(/[;,]/),
                        description,
                        driveLink: `https://drive.google.com/file/d/${response.data.id}`,
                    };

                    // Carrega o JSON existente e adiciona o novo documento
                    const { fileId, data: documents } = await loadJSON();

                    documents.push(newDocument);

                    // Salva o JSON atualizado
                    await saveJSON(fileId, documents);
                } 
            }
        }
    } catch (error) {
        console.error('Erro ao processar documentos:', error);
    }
}

// Função para ler e parsear a planilha local
async function parseSpreadsheet() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(path.resolve(BASE_FOLDER, 'planilha.xlsx'));

    const worksheet = workbook.worksheets[0]; // Pega a primeira planilha
    const data = [];

    worksheet.eachRow((row, rowNumber) => {
        data.push({
            Titulo: row.getCell(1).value,
            NomeDoPeriodico: row.getCell(3).value,
            AnoDePublicacao: row.getCell(4).value,
            Autores: row.getCell(5).value,
            Resumo: row.getCell(6).value,
            PalavrasChave: row.getCell(7).value,
            Pais: row.getCell(8).value,
        });
    });

    return data;
}

function normalizeString(str) {
    return str.replace(/[:.,]/g, '').toLowerCase().trim();
}

// Função para extrair metadados do arquivo usando o nome do arquivo e a planilha
async function extractMetadata(fileName, spreadsheetData) {
    const matchedRow = await spreadsheetData.find(row => normalizeString(fileName).includes(normalizeString(row.Titulo)));

    if (!matchedRow) {
        console.warn(`Nenhuma correspondência encontrada para o arquivo: ${fileName}`);
        return null;
    }

    return {
        title: matchedRow.Titulo,
        authors: matchedRow.Autores,
        location: matchedRow.Pais,
        date: matchedRow.AnoDePublicacao,
        tags: `${matchedRow.NomeDoPeriodico},${matchedRow.PalavrasChave}`,
        description: matchedRow.Resumo,
    };
}

async function loadJSON() {
    try {
        const response = await drive.files.list({
            q: `name='${JSON_FILE_NAME}'`,
            fields: 'files(id, name)',
            spaces: 'drive',
        });

        const files = response.data.files;

        if (!files || files.length === 0) throw new Error('Arquivo JSON não encontrado no Google Drive.');

        const fileId = files[0].id;
        const fileResponse = await drive.files.get({
            fileId,
            alt: 'media',
        });
        console.log(fileResponse.data);

        return { fileId, data: fileResponse.data };

    } catch (error) {
        console.log('Erro ao carregar o JSON:', error);
        return { fileId: '', data: [] };
    }
}

async function saveJSON(fileId, documents) {
    const buffer = Buffer.from(JSON.stringify(documents, null, 2));

    const media = {
        mimeType: 'application/json',
        body: Stream.Readable.from(buffer),
    };

    if (fileId) {
        // Atualiza o arquivo existente
        await drive.files.update({
            fileId,
            media,
        });
    } else {
        // Cria um novo arquivo
        await drive.files.create({
            requestBody: { name: JSON_FILE_NAME },
            media,
        });
    }
}

// Chame a função principal ao executar o módulo
main();
