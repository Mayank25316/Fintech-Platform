import { BarChartOutlined, MoreHoriz } from '@mui/icons-material';
import { Tooltip} from '@mui/material';
import { useGeneralContext } from './GeneralContext';

export default function WatchListAction({uid}) {
    const {openBuyWindow} = useGeneralContext();
    return (
        <span className='actions'>
            <span>
                <Tooltip title="Buy (B)" placement='top' arrow>
                    <button className='buy' onClick={()=>openBuyWindow(uid)}>Buy</button>
                </Tooltip>
                <Tooltip title="Sell (S)" placement='top' arrow>
                    <button className='sell'>Sell</button>
                </Tooltip>
                <Tooltip title="Analytics (A)" placement='top' arrow>
                    <button className='action'>
                        <BarChartOutlined className='icon'/>
                    </button>
                </Tooltip>
                <Tooltip title="More" placement='top' arrow>
                    <button className='action'>
                        <MoreHoriz className='icon'/>
                    </button>
                </Tooltip>
            </span>
        </span>
    );
}
