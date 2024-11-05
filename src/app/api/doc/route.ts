import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { Stream } from 'stream'

const oAuth2Client = new google.auth.OAuth2({
    clientId: '255256262245-2gfrra6riq4fi62ba0lmembsf8org4dt.apps.googleusercontent.com',
    clientSecret: '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',
    redirectUri: 'https://localhost',
});

const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline', 
    scope: ['https://www.googleapis.com/auth/drive'], 
    client_id: '255256262245-2gfrra6riq4fi62ba0lmembsf8org4dt.apps.googleusercontent.com',
    redirectUri: 'https://localhost',
});

oAuth2Client.setCredentials({
    refresh_token: '1//0hWu-iaB5DWErCgYIARAAGBESNwF-L9IrolDTbxUgeeaTjNTSUrdzTkV6CzLRmi16MXAr6IevBXeuF-SDzme3nauSHPzpqf18w3g ',
    scope: 'http://www.googleapis.com/auth/drive',
});

const drive = google.drive({ version: 'v3', auth: oAuth2Client });
const JSON_FILE_NAME = 'documents.json';  // Nome do arquivo no Google Drive

// Função para buscar o arquivo JSON no Google Drive
async function getJSONFile() {
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

// Função para salvar o arquivo JSON no Google Drive
async function saveJSONFile(fileId, documents) {
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

// Função GET para buscar os documentos
export async function GET() {
    console.log(authUrl);
    
    try {
        const { data } = await getJSONFile();
        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: 'Erro ao buscar documentos', error: error.message }, { status: 500 });
    }
}

// Função POST para adicionar novos documentos
export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get('file');
        const title = formData.get('title');
        const author = formData.get('author').split(',');
        const location = formData.get('location');
        const date = formData.get('date');
        const description = formData.get('description');
        const tags = formData.get('tags').split(',');

        // Upload do arquivo para o Google Drive
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileMetadata = { name: file.name };
        const response = await drive.files.create({
            requestBody: fileMetadata,
            media: {
                mimeType: file.type,
                body: new Stream.PassThrough().end(buffer),
            },
            fields: 'id, webViewLink',
        });

        const newDocument = {
            id: response.data.id,
            title,
            author,
            location,
            date,
            tags,
            description,
            driveLink: `https://drive.google.com/file/d/${response.data.id}`,
        };

        // Pegar os documentos existentes
        const { fileId, data: documents } = await getJSONFile();
        documents.push(newDocument);

        // Salvar o JSON atualizado no Google Drive
        await saveJSONFile(fileId, documents);

        return NextResponse.json({ message: 'Documento salvo com sucesso!' });
    } catch (error) {
        return NextResponse.json({ message: 'Erro ao salvar o documento', error: error.message }, { status: 500 });
    }
}

// Função PUT para atualizar os documentos
export async function PUT(req) {
    try {
        const formData = await req.formData();
        const id = formData.get('id');
        const title = formData.get('title');
        const author = formData.get('author').split(',');
        const location = formData.get('location');
        const date = formData.get('date');
        const tags = formData.get('tags').split(',');

        const { fileId, data: documents } = await getJSONFile();
        const documentIndex = documents.findIndex((doc) => doc.id === id);

        if (documentIndex === -1) {
            return NextResponse.json({ message: 'Documento não encontrado' }, { status: 404 });
        }

        let updatedDocument = { ...documents[documentIndex], title, author, location, date, tags };

        // Se houver um novo arquivo, faça o upload para o Google Drive
        const file = formData.get('file');
        if (file) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const fileMetadata = { name: file.name };
            const response = await drive.files.create({
                requestBody: fileMetadata,
                media: {
                    mimeType: file.type,
                    body: new Stream.PassThrough().end(buffer),
                },
                fields: 'id, webViewLink',
            });
            updatedDocument.driveLink = `https://drive.google.com/file/d/${response.data.id}`;
        }

        // Atualizar o documento no array
        documents[documentIndex] = updatedDocument;

        // Salvar o JSON atualizado no Google Drive
        await saveJSONFile(fileId, documents);

        return NextResponse.json({ message: 'Documento atualizado com sucesso!', document: updatedDocument });
    } catch (error) {
        return NextResponse.json({ message: 'Erro ao atualizar o documento', error: error.message }, { status: 500 });
    }
}

// Função DELETE para remover documentos
export async function DELETE(req) {
    try {
        const { id } = await req.json();
        const { fileId, data: documents } = await getJSONFile();
        const documentIndex = documents.findIndex((doc) => doc.id === id);

        if (documentIndex === -1) {
            return NextResponse.json({ message: 'Documento não encontrado' }, { status: 404 });
        }

        // Remover o arquivo do Google Drive
        await drive.files.delete({ fileId: documents[documentIndex].id });

        // Remover o documento do array
        documents.splice(documentIndex, 1);

        // Salvar o JSON atualizado no Google Drive
        await saveJSONFile(fileId, documents);

        return NextResponse.json({ message: 'Documento removido com sucesso!' });
    } catch (error) {
        return NextResponse.json({ message: 'Erro ao remover o documento', error: error.message }, { status: 500 });
    }
}
