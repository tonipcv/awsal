// Simple script to test the prescription API
import fetch from 'node-fetch';

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWN0aXF5aDQwMDAwamVkaGV5dnFvYzRmIiwiZW1haWwiOiJ2dW9tbGlmZUBnbWFpbC5jb20iLCJuYW1lIjoiVG9uaSIsInJvbGUiOiJET0NUT1IiLCJpYXQiOjE3NTMyNzY5NDgsImV4cCI6MTc1MzM2MzM0OH0.r93GxXLh4t_QkUC7sf8CNVeD5Ynaq4_AbmDO5PzKtas";
const API_URL = "https://0def9ae2b9a6.ngrok-free.app/api/v2/doctor/prescriptions";

async function testPrescriptionAPI() {
  try {
    console.log("Testing prescription API...");
    
    // Test creating a prescription with email
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        protocol_id: "cmctistkt000ajedh17fpcefw",
        email: "xppsalvador@gmail.com",
        planned_start_date: "2025-07-25",
        planned_end_date: "2025-08-25",
        consultation_date: "2025-07-20"
      })
    });
    
    const responseText = await response.text();
    console.log("Status:", response.status);
    console.log("Response:", responseText);
    
    try {
      const responseJson = JSON.parse(responseText);
      console.log("Parsed JSON:", JSON.stringify(responseJson, null, 2));
    } catch (e) {
      console.log("Could not parse response as JSON");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

testPrescriptionAPI();
