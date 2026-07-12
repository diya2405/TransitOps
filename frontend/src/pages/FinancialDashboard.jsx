import "./FinancialDashboard.css";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";


function FinancialDashboard() {


  const monthlyExpenses = [
    {
      month: "Jan",
      expense: 6500
    },
    {
      month: "Feb",
      expense: 13000
    },
    {
      month: "Mar",
      expense: 19500
    },
    {
      month: "Apr",
      expense: 26000
    },
    {
      month: "May",
      expense: 22000
    },
    {
      month: "Jun",
      expense: 15000
    }
  ];


  const expenseDistribution = [
    {
      name: "Fuel",
      value: 62500
    },
    {
      name: "Maintenance",
      value: 38000
    },
    {
      name: "Other",
      value: 15000
    },
    {
      name: "Toll",
      value: 9500
    }
  ];


  const fuelLogs = [
    {
      vehicle: "Van-01",
      liters: "50 L",
      cost: "₹5200",
      date: "12 Jul 2026"
    },
    {
      vehicle: "Truck-01",
      liters: "70 L",
      cost: "₹7200",
      date: "11 Jul 2026"
    },
    {
      vehicle: "Van-02",
      liters: "42 L",
      cost: "₹4300",
      date: "10 Jul 2026"
    }
  ];


  const expenses = [
    {
      vehicle: "Van-01",
      type: "Fuel",
      amount: "₹5200"
    },
    {
      vehicle: "Truck-01",
      type: "Maintenance",
      amount: "₹8000"
    },
    {
      vehicle: "Van-02",
      type: "Toll",
      amount: "₹500"
    }
  ];



  return (

    <div className="dashboard">


      <h1>Financial Analyst Dashboard</h1>



      {/* KPI CARDS */}

      <div className="card-container">


        <div className="card">
          <h3>Total Expense</h3>
          <p>₹125000</p>
        </div>


        <div className="card">
          <h3>Fuel Cost</h3>
          <p>₹62500</p>
        </div>


        <div className="card">
          <h3>Maintenance Cost</h3>
          <p>₹38000</p>
        </div>


        <div className="card">
          <h3>Fleet ROI</h3>
          <p>18.5%</p>
        </div>


      </div>





      {/* MONTHLY EXPENSE CHART */}


      <div className="section">

        <h2>Monthly Expenses</h2>


        <div className="chart-container">


          <ResponsiveContainer width="100%" height={300}>


            <BarChart data={monthlyExpenses}>


              <XAxis dataKey="month"/>

              <YAxis/>

              <Tooltip/>


              <Bar 
                dataKey="expense"
              />


            </BarChart>


          </ResponsiveContainer>


        </div>


      </div>






      {/* PIE CHART */}


      <div className="section">


        <h2>Expense Distribution</h2>


        <div className="chart-container">


        <ResponsiveContainer width="100%" height={300}>


          <PieChart>


            <Pie

              data={expenseDistribution}

              dataKey="value"

              nameKey="name"

              outerRadius={100}

              label

            >

              {
                expenseDistribution.map((item,index)=>(

                  <Cell key={index}/>

                ))
              }


            </Pie>


            <Tooltip/>


            <Legend/>


          </PieChart>



        </ResponsiveContainer>


        </div>


      </div>






      {/* FUEL LOG TABLE */}


      <div className="section">


        <h2>Recent Fuel Logs</h2>


        <table>


          <thead>

            <tr>

              <th>Vehicle</th>

              <th>Liters</th>

              <th>Cost</th>

              <th>Date</th>

            </tr>

          </thead>



          <tbody>


          {
            fuelLogs.map((log,index)=>(

              <tr key={index}>

                <td>{log.vehicle}</td>

                <td>{log.liters}</td>

                <td>{log.cost}</td>

                <td>{log.date}</td>


              </tr>


            ))
          }


          </tbody>


        </table>


      </div>






      {/* EXPENSE TABLE */}



      <div className="section">


        <h2>Recent Expenses</h2>


        <table>


          <thead>


            <tr>

              <th>Vehicle</th>

              <th>Type</th>

              <th>Amount</th>

            </tr>


          </thead>




          <tbody>


          {
            expenses.map((expense,index)=>(


              <tr key={index}>


                <td>{expense.vehicle}</td>

                <td>{expense.type}</td>

                <td>{expense.amount}</td>


              </tr>


            ))
          }


          </tbody>


        </table>



      </div>




    </div>


  );

}


export default FinancialDashboard;