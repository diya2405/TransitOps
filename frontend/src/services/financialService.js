const API_URL = "http://localhost:5000/api";


export const getFinancialDashboard = async () => {

    const response = await fetch(
        `${API_URL}/financial/dashboard`
    );

    return response.json();

};



export const getFuelLogs = async () => {

    const response = await fetch(
        `${API_URL}/financial/fuel-logs`
    );

    return response.json();

};



export const getExpenses = async () => {

    const response = await fetch(
        `${API_URL}/financial/expenses`
    );

    return response.json();

};



export const getMonthlyExpenses = async () => {

    const response = await fetch(
        `${API_URL}/financial/monthly-expense`
    );

    return response.json();

};