import React, { useState, useEffect } from 'react';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import axios from 'axios';
import * as XLSX from 'xlsx';

import logo from './logo.svg';
import './App.css';

const initialOptions = {
  rangeSelector: {
    selected: 1
  },
  plotOptions: {
    candlestick: {
        color: 'pink',
        lineColor: 'red',
        upColor: 'lightgreen',
        upLineColor: 'green'
    }
  },
  title: {
    text: 'Hiihtoliitto Market Index for year 2024'
  },
  yAxis: {
    crosshair: true
  },
  series: [
    {
      data: [],
      dateFormat: 'YYYY-MM-dd',
      tooltip: {
        valueDecimals: 2
      }
    }
  ]
};

function App() {
  const [chartData, setChartData] = useState(null);
  const [chartOptions, setChartOptions] = useState(initialOptions);
  const paymentStartCell = 5;

  const parseJson = (json) => {
    const paymentRange = json.slice(paymentStartCell, json.length);

    return paymentRange.filter((p) => {
      if (p[15] && typeof p[15] === 'number') {
        return p[15];
      }
    }).map((f) => [f[14], f[15]]);

  }

  useEffect(() => {
    const handleFetchFromUrl = async () => {
      try {
        const url = 'https://docs.google.com/spreadsheets/d/1aQF-7tfFYjKxg4Und36zwpilFxz3UgtzJZsBV5jSyII/edit#gid=0';
        const response = await axios.get(url, { responseType: 'arraybuffer' });
  
        const data = new Uint8Array(response.data);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        const parsedData = parseJson(jsonData);
        setChartData(parsedData);
        const options = chartOptions;
        options.series.data = parsedData;
        setChartOptions(options);
      } catch (error) {
        console.error('Error fetching or parsing Excel file:', error);
      }
    };
    handleFetchFromUrl();
  }, []);

  const options = {
    rangeSelector: {
      selected: 1
    },
    plotOptions: {
      candlestick: {
          color: 'pink',
          lineColor: 'red',
          upColor: 'lightgreen',
          upLineColor: 'green'
      }
    },
    title: {
      text: 'Hiihtoliitto Market Index for year 2024'
    },
    yAxis: {
      crosshair: true
    },
    series: [
      {
        data: chartData,
        dateFormat: 'YYYY-MM-dd',
        tooltip: {
          valueDecimals: 2
        }
      }
    ]
  };

  return (
    <div className="App">
      <HighchartsReact highcharts={Highcharts} constructorType={'stockChart'} options={options} />

      excel:

      <div>{chartData}</div>
    </div>
  );
}

export default App;
