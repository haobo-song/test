import { useEffect, useState } from 'react'
import { Card, Title, Text, Grid, Col, Metric, Badge, AreaChart, Tab, TabList, TabGroup, TabPanel, TabPanels } from "@tremor/react";
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

interface HistoricalData {
  date: string;
  price: number;
  volume: number;
}

interface MarketData {
  [symbol: string]: {
    symbol: string;
    name: string;
    current_price: number | null;
    change: number | null;
    change_percent: number | null;
    volume: number | null;
    history: HistoricalData[];
  };
}

const stockInfo = {
  "^GSPC": { name: "S&P 500", color: "slate", logo: "📈" },
  AAPL: { name: "Apple Inc.", color: "rose", logo: "🍎" },
  GOOGL: { name: "Alphabet Inc.", color: "blue", logo: "🔍" },
  MSFT: { name: "Microsoft Corp.", color: "cyan", logo: "💻" },
  AMZN: { name: "Amazon.com Inc.", color: "amber", logo: "📦" },
  META: { name: "Meta Platforms Inc.", color: "indigo", logo: "👥" }
};

function formatNumber(num: number | null): string {
  if (num === null) return 'N/A';
  if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
  if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
  return num.toString();
}

function formatPrice(price: number | null): string {
  if (price === null) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
}

function App() {
  const [marketData, setMarketData] = useState<MarketData>({});
  const [selectedStock, setSelectedStock] = useState<string>("^GSPC");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/market-data');
        const data = await response.json();
        setMarketData(data);
      } catch (error) {
        console.error('Error fetching market data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getChartData = () => {
    if (!marketData[selectedStock]?.history) return [];
    return marketData[selectedStock].history.map(item => ({
      date: item.date,
      [selectedStock]: item.price
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-2xl text-blue-500">Loading market data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-8 bg-blue-500"></div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              Market Dashboard
            </h1>
          </div>
          <p className="text-gray-400 ml-5">Historical market data analysis</p>
        </div>

        <TabGroup>
          <TabList className="mb-8 border-gray-800">
            <Tab className="text-gray-400 hover:text-blue-500">Market Overview</Tab>
            <Tab className="text-gray-400 hover:text-blue-500">Price History</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <Grid numItems={1} numItemsSm={2} numItemsLg={3} className="gap-6">
                {Object.entries(marketData).map(([symbol, data]) => {
                  const info = stockInfo[symbol as keyof typeof stockInfo];
                  return (
                    <Card 
                      key={symbol}
                      decoration="top"
                      decorationColor={info.color}
                      className={`cursor-pointer hover:shadow-2xl transition-all duration-300 bg-gray-900 border-gray-800 
                        ${data.current_price === null ? 'opacity-50' : 'hover:scale-105'}`}
                      onClick={() => data.current_price !== null && setSelectedStock(symbol)}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <Text className="text-gray-400">{data.name}</Text>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{info.logo}</span>
                            <Title className="text-white">{symbol === "^GSPC" ? "S&P 500" : symbol}</Title>
                          </div>
                        </div>
                        {data.change !== null && data.change_percent !== null && (
                          <Badge color={data.change >= 0 ? "emerald" : "red"}>
                            <div className="flex items-center gap-1">
                              {data.change >= 0 ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
                              {Math.abs(data.change_percent).toFixed(2)}%
                            </div>
                          </Badge>
                        )}
                      </div>
                      <Metric className="text-white">{formatPrice(data.current_price)}</Metric>
                      <Text className="mt-2 text-gray-400">Volume: {formatNumber(data.volume)}</Text>
                      {data.current_price === null && (
                        <Text className="text-red-500 mt-2">Error loading data</Text>
                      )}
                    </Card>
                  );
                })}
              </Grid>
            </TabPanel>
            <TabPanel>
              <Card className="bg-gray-900 border-gray-800">
                <div className="flex items-center justify-between mb-8">
                  <Title className="text-white">1 Year Price History</Title>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(stockInfo).map(([symbol, info]) => (
                      <Badge
                        key={symbol}
                        color={symbol === selectedStock ? info.color : "gray"}
                        className="cursor-pointer hover:scale-110 transition-transform"
                        onClick={() => setSelectedStock(symbol)}
                      >
                        {info.logo} {symbol === "^GSPC" ? "S&P 500" : symbol}
                      </Badge>
                    ))}
                  </div>
                </div>
                <AreaChart
                  className="h-96 mt-4"
                  data={getChartData()}
                  index="date"
                  categories={[selectedStock]}
                  colors={[stockInfo[selectedStock as keyof typeof stockInfo].color]}
                  showLegend={false}
                  showGridLines={true}
                  startEndOnly={false}
                  showAnimation={true}
                  valueFormatter={(value) => formatPrice(Number(value))}
                  curveType="natural"
                  showXAxis={true}
                  showYAxis={true}
                />
              </Card>
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </div>
    </div>
  );
}

export default App;
