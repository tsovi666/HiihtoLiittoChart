import React, { useState, useEffect } from 'react';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import axios from 'axios';
import logo from './assets/hiihtoliitto-black.png';
import eng from './assets/en.png';
import fin from './assets/fi.webp';
import swe from './assets/sv.png';
import ger from './assets/de.png';
import './App.css';

import {
  Message,
  MessageProvider,
  useMessageGetter
} from '@messageformat/react';
import messages from './messages/msgData.js';;

function App() {
  const getTranslations = useMessageGetter('');

  const [chartData, setChartData] = useState([]);
  const [investors, setInvestors] = useState([]);
  const [chartOptions, setChartOptions] = useState(
    {
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
      yAxis: {
        crosshair: true
      },
      series: [
        {
          name: 'HTLT',
            data: chartData,
            dateFormat: 'YYYY-MM-dd',
            tooltip: {
              valueDecimals: 2
            }
        }
      ]
    }
  );
  const [equity, setEquity] = useState(0);
  const [lang, setLang] = useState('en');
  const [titleText, setTitleText] = useState('');

  const [percentages, setPercentages] = useState({
    ytd: 0,
    one: 0,
    three: 0,
    six: 0
  });

  const epoch = new Date('2024-03-01');

  const getYtdPercentage = (data) => {
    const initialValue = data[1][1];
    const totalValue = data[data.length-1][1];

    const percentage = (totalValue - initialValue) / initialValue;

    return percentage.toFixed(2);
  };

  const getMonthPercentage = (data, months) => {
    const now = new Date();
    const startDate = now.setMonth(now.getMonth() - months);

    const rangeData = data.filter((d) => {
      if (d[0] >= startDate && d[1] > 0) {
        return d;
      }
    });
    
    if (rangeData.length > 0) {
      const initialValue = rangeData[0][1];
      const totalValue = rangeData[rangeData.length-1][1];
      const percentage = (totalValue - initialValue) / initialValue;
      return percentage.toFixed(2);
    }

    return 0;
  };

  const getEquity = (data) => {
    return data.map((d) => d.amount).reduce((a, b) => {
      return Number(a) + Number(b);
    })
  };

  const parseResponse = (data) => {
    let index = Number(0);
    return data.map((d) => {
      index += Number(d.amount);
      return [new Date(d.date).getTime(), index];
    })
  };

  const getSvName = () => {
    const first = ['Sven', 'Göran', 'Nils', 'Håmå', 'Björn', 'Åke', 'Olle', 'Gustav', 'Olof'];
    const last = ['Andersson', 'Karlsson', 'Nilsson', 'Eriksson', 'Larsson', 'Olsson', 'Persson', 'Svensson', 'Gustafsson'];

    const f = first[Math.floor(Math.random() * first.length)];
    const l = last[Math.floor(Math.random() * last.length)];

    return f + ' ' + l;
  };

  const getDeName = () => {
    const first = ['Adolf', 'Hermann', 'Rudolf', 'Josef', 'Heinrich', 'Joachim', 'Albert', 'Ernst', 'Erwin'];
    const last = ['Hitler', 'Himmler', 'Hess', 'Goebbels', 'Rommel', 'Göring', 'Von Ribbentrop', 'Röhm', 'Scheisse'];

    const f = first[Math.floor(Math.random() * first.length)];
    const l = last[Math.floor(Math.random() * last.length)];

    return f + ' ' + l;
  };


  const getInvestors = (data) => {
    const names = [...new Set(data.map(d => d.investor))];
    
    let parsedInvestors = names.map((n) => {
      const investorTotal = data.map((d) => {
        if (d.investor === n) {
          return Number(d.amount);
        }
      }).filter(f => typeof f !== 'undefined').reduce((a, b) => { return Number(a) + Number(b) });

      let name = n;

      if (lang === 'sv') {
        name = getSvName();
      }

      if (lang === 'de') {
        name = getDeName();
      }

      return {
        name: name,
        amount: investorTotal
      };
    });

    return parsedInvestors;
  };

  useEffect(() => {
    const handleFetchFromUrl = async () => {
      try {
        const dataUrl = process.env.DATA_BASEURL;
        const response = await axios.get(`${dataUrl}/data`);
        const parsedData = [[epoch.getTime(), 0]].concat(parseResponse(response.data));

        setEquity(getEquity(response.data));
        setChartData(parsedData);
        
        const options = chartOptions;
        options.series.data = response.data;
        setChartOptions(options);
        
        const ytd = getYtdPercentage(parsedData);
        const month = getMonthPercentage(parsedData, 1);
        const threeMonths = getMonthPercentage(parsedData, 3);
        const sixMonths = getMonthPercentage(parsedData, 6);
        setPercentages({
          ytd: ytd,
          one: month,
          three: threeMonths,
          six: sixMonths
        });

        setInvestors(getInvestors(response.data));

        setTitleText(getTranslations('title'));

        return parsedData;
      } catch (error) {
        console.error('Error:', error);
      }
    };
    handleFetchFromUrl();
  }, [lang]);

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
      text: titleText
    },
    yAxis: {
      crosshair: true
    },
    series: [
      {
        name: 'HTLT',
          data: chartData,
          dateFormat: 'YYYY-MM-dd',
          tooltip: {
            valueDecimals: 2
          }
      }
    ]
  };

  const switchLang = (lang, e) => {
    setLang(lang);
  };

  return (
    <MessageProvider messages={messages[lang]}>
      <div className="App">
        <div className="main-content">
          <div className="data-content-wrapper">
            <div className="header">
              <img src={logo} />
              <div className="lang-selector">
                <button onClick={(e) => switchLang('en', e)} id="en" className={ lang === 'en' ? 'active' : '' }><img src={eng} /></button>
                <button onClick={(e) => switchLang('fi', e)} id="en" className={ lang === 'fi' ? 'active' : '' }><img src={fin} /></button>
                <button onClick={(e) => switchLang('sv', e)} id="sv" className={ lang === 'sv' ? 'active' : '' }><img src={swe} /></button>
                <button onClick={(e) => switchLang('de', e)} id="de" className={ lang === 'de' ? 'active' : '' }><img src={ger} /></button>
              </div>
            </div>
          </div>
          <div className="data-content-wrapper">
            <div className="chartWrapper">
              <HighchartsReact highcharts={Highcharts} constructorType={'stockChart'} options={options} />
            </div>
          </div>
          <div className="data-content-wrapper">
            <div className="data-content">
              <h2><Message id="performance" /></h2>
              <div className="data-content-part">
                <h3>YTD</h3>
                <span className={percentages.ytd >= 0 ? 'positive' : 'negative'}>{percentages.ytd} %</span>
              </div>
              <div className="data-content-part">
                <h3><Message id="month" /></h3>
                <span className={percentages.one >= 0 ? 'positive' : 'negative'}>{percentages.one} %</span>
              </div>
              <div className="data-content-part">
                <h3>3 <Message id="months" /></h3>
                <span className={percentages.three >= 0 ? 'positive' : 'negative'}>{percentages.three} %</span>
              </div>
              <div className="data-content-part">
                <h3>6 <Message id="months" /></h3>
                <span className={percentages.six >= 0 ? 'positive' : 'negative'}>{percentages.six} %</span>
              </div>
            </div>
            <div className="data-content">
              <h2><Message id="valuation" /></h2>
              <div className="data-content-part">
                <h3><Message id="equity" /></h3>
                <span className={equity >= 0 ? 'positive' : 'negative'}>{equity} €</span>
              </div>
            </div>
            <div className="data-content">
              <h2><Message id="shareholders" /></h2>
              <div className="data-tableheader">
                <h3><Message id="name" /></h3>
                <h3 className="invested"><Message id="invested" /></h3>
              </div>
              {investors.map((s, i) => {
                return (
                  <div key={i} className="data-content-part">
                    <div className="holder-wrapper">
                      <p>{s.name}</p>
                      <p className="invested-amount">{s.amount}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </MessageProvider>
  );
}

export default App;
