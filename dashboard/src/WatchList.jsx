import { watchlist } from "./data/data";
import WatchlistItem from "./WatchlistItem";
import { DoughnutChart } from "./DoughnutChart";
import { useLiveDataContext } from "./LiveDataContext";

export default function WatchList(){
  const { livePrices } = useLiveDataContext();

  const data = {
    labels: watchlist.map((stock) => stock.name),
    
    datasets: [
      {
        label: 'Price',
        data: watchlist.map((stock) => {
          const currentData = livePrices[stock.name];
          return currentData ? currentData.price : stock.price; 
        }),
        backgroundColor: [
          'rgba(43, 89, 195, 0.8)',   
          'rgba(43, 144, 143, 0.8)',  
          'rgba(100, 181, 246, 0.8)', 
          'rgba(76, 175, 80, 0.8)',   
          'rgba(26, 35, 126, 0.8)',   
          'rgba(0, 188, 212, 0.8)',   
        ],
        borderColor: [
          'rgba(255, 255, 255, 1)',  
          'rgba(255, 255, 255, 1)',
          'rgba(255, 255, 255, 1)',
          'rgba(255, 255, 255, 1)',
          'rgba(255, 255, 255, 1)',
          'rgba(255, 255, 255, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };
  

  return (
    <div className="watchlist-container">
      <div className="search-container">
        <input
          type="text"
          name="search"
          id="search"
          placeholder="Search eg:infy, bse, nifty fut weekly, gold mcx"
          className="search"
        />
        <span className="counts">{watchlist.length}/50</span>
      </div>
      <ul className="list">
        {watchlist.map((stock, index)=>{
          return <WatchlistItem stock={stock} key={index} liveData={livePrices[stock.name]}/>
        })}
      </ul>
      <DoughnutChart data={data}/>
    </div>
  );
}

