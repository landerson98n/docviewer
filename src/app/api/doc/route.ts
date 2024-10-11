import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { google } from 'googleapis'
import { Stream } from 'stream'
const dataFilePath = path.join(process.cwd(), 'data', 'documents.json')

const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
)

const credentials = oAuth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    scope: 'https://www.googleapis.com/auth/drive',
});

const drive = google.drive({ version: 'v3', auth: oAuth2Client });

// Função para fazer upload do arquivo no Google Drive
export async function GET() {
    try {
        // Lê o arquivo JSON
        const fileData = await fs.readFile(dataFilePath, 'utf-8');

        // Converte para JSON
        const documents = JSON.parse(fileData);

        // Retorna a resposta com os documentos
        return NextResponse.json(documents, { status: 200 });
    } catch (error) {
        // Caso ocorra algum erro ao ler o arquivo ou converter para JSON
        return NextResponse.json({ message: 'Erro ao buscar documentos', error: error.message }, { status: 500 });
    }
}

export async function POST(req) {

    // Pegue o formData
    const formData = await req.formData();
    const file = formData.get('file'); // Pegue o arquivo enviado no form-data
    const title = formData.get('title');
    const author = formData.get('author');
    const location = formData.get('location');
    const date = formData.get('date');
    const tags = formData.get('tags').split(',');

    const buffer = Buffer.from(await file.arrayBuffer()); // Converta o arquivo para buffer

    const fileMetadata = {
        name: file.name,
    };

    const response = await drive.files.create({
        requestBody: fileMetadata,
        media: {
            mimeType: file.type,
            body: new Stream.PassThrough().end(buffer)
        },
        fields: 'id, webViewLink'
    });

    // Preparar os dados do documento
    const newDocument = {
        title,
        author,
        location,
        date,
        tags,
        driveLink: `https://drive.google.com/file/d/${response.data.id}`,
    };

    // Ler o arquivo JSON existente (ou criar uma nova lista)
    let documents = [];

    try {
        const fileData = await fs.readFile(dataFilePath, 'utf-8');
        documents = JSON.parse(fileData);
    } catch (error) {
        documents = []; // arquivo não existe, criar um novo array
    }

    // // Adicionar o novo documento
    documents.push(newDocument);

    // // Escrever o arquivo atualizado
    await fs.writeFile(dataFilePath, JSON.stringify(documents, null, 2));

    return NextResponse.json({ message: 'Documento salvo com sucesso!' });


}

export const config = {
    api: {
        bodyParser: false, // Desativa o parser do corpo para lidar com FormData
    },
};
