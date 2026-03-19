import axios from "axios";
import { useState, useEffect } from "react";

export default function Orders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/allorders`, { withCredentials: true }).then((res) => {
      const today = new Date().toISOString().split('T')[0];
      const todaysOrders = res.data.filter((order) => {
        if (!order.createdAt) return true; 
        const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
        return orderDate === today;
      });
      setOrders(todaysOrders);
    })
      .catch((err) => console.log(err));
  }, []);

  return (
    <div className="orders">
      <h3 className="title">Orders({orders.length})</h3>

      <div className="order-table">
        <table>
          <tr>
            <th>Product</th>
            <th>Qty.</th>
            <th>Price</th>
            <th>Mode</th>
          </tr>
          {Array.isArray(orders) ? orders.map((stock, index) => {
            return (
              <tr key={index}>
                <td>{stock.name}</td>
                <td>{stock.qty}</td>
                <td>{stock.price.toFixed(2)}</td>
                <td>{stock.mode}</td>
              </tr>
            );
          }):null}
        </table>
      </div>
    </div>
  );
}

