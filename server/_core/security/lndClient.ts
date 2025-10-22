// server/_core/security/lndClient.ts
import fs from 'fs';
import path from 'path';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import hex from 'hex-lite';
import dotenv from 'dotenv';
dotenv.config();

const PROTO_PATH = path.resolve(__dirname, '../proto/rpc.proto'); // download lnd proto or precompiled

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const lnrpc = grpc.loadPackageDefinition(packageDefinition).lnrpc;

function loadMacaroonHex(macaroonPath: string): string {
  return fs.readFileSync(macaroonPath).toString('hex');
}

export function lndClient() {
  const lndCert = fs.readFileSync(process.env.LND_TLS_CERT!);
  const sslCreds = grpc.credentials.createSsl(lndCert);

  const macaroonHex = loadMacaroonHex(process.env.LND_MACAROON_PATH!);

  // macaroon metadata credentials
  const macaroonCreds = grpc.credentials.createFromMetadataGenerator((_args, callback) => {
    const metadata = new grpc.Metadata();
    metadata.add('macaroon', macaroonHex);
    callback(null, metadata);
  });

  const creds = grpc.credentials.combineChannelCredentials(sslCreds, macaroonCreds);

  const client = new lnrpc.Lightning(process.env.LND_GRPC_HOST!, creds, {
    'grpc.max_receive_message_length': 50 * 1024 * 1024,
  });

  return client;
}
