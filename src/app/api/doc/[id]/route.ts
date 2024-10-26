import fs from 'fs';
import path from 'path';
import * as xlsx from 'xlsx';
import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import * as Stream from 'stream';

const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

oAuth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    scope: 'https://www.googleapis.com/auth/drive',
});

// Configurações do Google Drive
const drive = google.drive({ version: 'v3', auth: oAuth2Client });

// Caminho base da pasta e arquivos locais
const BASE_FOLDER = path.resolve('PROJETO_SIA_ECONOMIA/DIGITAL_ECONOMY');

// Função principal para processar arquivos PDF, enviá-los ao Google Drive e atualizar JSON
export async function POST(req) {
    try {
        // Obtém os dados da planilha como array de objetos
        const spreadsheetData = parseSpreadsheet();

        // Pega os anos (2019-2023)
        for (let year = 2019; year <= 2023; year++) {
            const yearFolder = path.join(BASE_FOLDER, String(year));

            // Lê todos os arquivos PDF na pasta do ano
            const files = fs.readdirSync(yearFolder).filter(file => file.endsWith('.pdf'));

            // Itera sobre cada arquivo PDF na pasta do ano
            for (const fileName of files) {
                const filePath = path.join(yearFolder, fileName);
                const fileContent = fs.readFileSync(filePath); // Lê o conteúdo do PDF
                const fileMetadata = extractMetadata(fileName, spreadsheetData);

                // Realiza o upload do arquivo PDF no Google Drive
                const response = await drive.files.create({
                    requestBody: { name: fileName },
                    media: {
                        mimeType: 'application/pdf',
                        body: Stream.Readable.from(fileContent),
                    },
                    fields: 'id, webViewLink',
                });

                if (fileMetadata) {
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
        return NextResponse.json({ message: 'Documentos processados e enviados com sucesso!' });
    } catch (error) {
        return NextResponse.json({ message: 'Erro ao processar documentos', error: error.message }, { status: 500 });
    }
}

// Função para ler e parsear a planilha local
function parseSpreadsheet() {
    const workbook = xlsx.readFile(path.resolve('planilha.xlsx'));
    console.log(workbook);
    
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    return data.map(row => ({
        Titulo: row['Titulo'],
        NomeDoPeriodico: row['Nome do periódico'],
        AnoDePublicacao: row['Ano de publicação'],
        Autores: row['Autores'],
        Resumo: row['Resumo'],
        PalavrasChave: row['Palavras-chave'],
        Pais: row['PAÍS'],
    }));
}

// Função para extrair metadados do arquivo usando o nome do arquivo e a planilha
function extractMetadata(fileName, spreadsheetData) {
    const matchedRow = spreadsheetData.find(row => fileName.includes(row.Titulo));
    if (!matchedRow) return null;

    return {
        title: matchedRow.Titulo,
        authors: matchedRow.Autores,
        location: matchedRow.Pais,
        date: matchedRow.AnoDePublicacao,
        tags: matchedRow.NomeDoPeriodico + ',' + matchedRow.PalavrasChave,
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

        const fileId = files[0].id;
        const fileResponse = await drive.files.get({
            fileId,
            alt: 'media',
        });

        return { fileId, data: fileResponse.data };


    } catch (error) {
        console.log(error);
    }
}


async function saveJSON(fileId, documents) {
    const buffer = Buffer.from(JSON.stringify(documents, null, 2));

    const media = {
        mimeType: 'application/json',
        body: new Stream.PassThrough().end(buffer),
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

