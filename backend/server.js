const express = require('express');
const cors = require('cors');
const schedule = require('node-schedule');
const { Client } = require('pg');
const XLSX = require("xlsx");
const axios = require('axios');
const app = express();
app.use(cors());

const backendPort = 3003;
const paymentStartCell = 4;

const dbHost = process.env.DB_HOST;
const dbPort = process.env.DB_PORT;
const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASS;
const dbName = process.env.DB_NAME;

const serverHost = process.env.SERVER_HOST;

const sheetUrl = 'https://docs.google.com/spreadsheets/d/1kbW0Pikfe53vYxjaJSZfjb8WESh9x3litGVqnkNU-n0/edit?gid=0#gid=0'; // 'https://docs.google.com/spreadsheets/d/1aQF-7tfFYjKxg4Und36zwpilFxz3UgtzJZsBV5jSyII/edit#gid=0';

const client = new Client({
    user: dbUser,
    host: dbHost,
    database: dbName,
    password: dbPass,
    port: dbPort
});

(async () => {
    console.log('Connecting to database');
    console.log(dbHost);
    console.log(dbPort);
    await client.connect();
    console.log('Database connected');
})().catch(console.error);

const storeTransaction = async (investor, amount) => {
    console.log('Adding new transaction from: ' + investor + ', amount: ' + amount);
    const now = new Date().getTime();
    await client.query(`INSERT INTO transaction (date, investor, amount) VALUES (to_timestamp(${now} / 1000.0), '${investor}', ${amount})`);
};

const sheetChanged = async (sheet) => {
    try {
        const res = await client.query('SELECT * from transaction');
        const transactions = res.rows;

        sheet.forEach((s) => {
            investorTransactions = transactions.filter((i) => {
                if (i.investor === s.investor) return i.amount;
            }).map((m) => m.amount);

            const investorTotal = investorTransactions.reduce((a, b) => { return Number(a) + Number(b) }, 0);

            if (s.amount > investorTotal) {
                console.log('New transactions found, updating database');
                storeTransaction(s.investor, s.amount - investorTotal);
            }
        });

    } catch (e) {
        console.log('errorrr');
        console.log(e);
    }
};

const getSheet = async () => {
    console.log('Getting new transaction data');

    const response = await axios.get(sheetUrl, { responseType: 'arraybuffer' });
  
    const data = new Uint8Array(response.data);
    const workbook = XLSX.read(data, { type: 'array', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    return parseJson(jsonData);
};

const parseJson = (json) => {
    const paymentRange = json.slice(paymentStartCell, json.length);

    return paymentRange.filter((p) => {
      if (p[15] && typeof p[15] === 'number') {
        return p[15];
      }
    }).map((f) => {
      return {
        investor: f[14],
        amount: f[15]
      };
    });
};

const getData = async () => {
    const transactionData = await client.query('SELECT * from transaction');
    return transactionData.rows;
};

app.get('/data', async (req, res) => {
    console.log('Fetching transaction data from the database');
    const transactionData = await getData();

    res.send(transactionData);
});

app.get('/', (req, res) => {
    res.send('Hello World!')
});

const job = schedule.scheduleJob('* / 20 * * * *', async () => {
    const sheet = await getSheet();
    const changed = await sheetChanged(sheet);
});

app.listen(backendPort, () => {
    console.log(`Server running on http://${serverHost}:${backendPort}`);
});
