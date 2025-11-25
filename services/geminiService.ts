import { GoogleGenAI } from "@google/genai";
import { AppState, Product, Customer, Order } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to generate a prompt based on current context
export const generateAIResponse = async (
  userPrompt: string, 
  currentContext: AppState
): Promise<string> => {
  if (!apiKey) return "API Key not configured.";

  try {
    // We provide a simplified context to the AI to save tokens but ensure accuracy
    const contextString = JSON.stringify({
      config: currentContext.config,
      products: currentContext.products.map(p => ({ id: p.id, name: p.name, price: p.price, stock: p.stock })),
      customers: currentContext.customers.map(c => ({ id: c.id, name: c.name, company: c.company })),
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an intelligent ERP assistant for ${currentContext.config.name}.
      
      Current System Data:
      ${contextString}

      User Query: "${userPrompt}"

      INSTRUCTIONS:
      1. If the user wants to CREATE AN ORDER (e.g., "Order 5 mice for John"), you MUST return a raw JSON object with this schema:
         {
           "action": "create_order",
           "customerId": "exact_id_from_context",
           "items": [
             { "productId": "exact_id_from_context", "quantity": number }
           ],
           "confirmationMessage": "Short summary of what was done"
         }
         - Infer the correct Product ID and Customer ID. If ambiguous, ask for clarification in plain text (do not return JSON).

      2. If the user wants to CHECK STOCK or LOOK UP A PRODUCT (e.g., "How many mice do we have?", "Show stock for PROD001"), return a raw JSON object:
         {
           "action": "lookup_product",
           "productId": "exact_id_from_context"
         }

      3. If the user wants to UPDATE STOCK or RECEIVE SHIPMENT (e.g., "Received shipment of 20 cables", "Add 50 units to Wireless Mouse"), return a raw JSON object:
         {
           "action": "update_stock",
           "productId": "exact_id_from_context",
           "quantity": number
         }
         - Quantity should be the amount to ADD.

      4. If the user wants to SEE CUSTOMER ORDERS or SPENDING HISTORY (e.g., "Show orders for John", "Total spent by Tech Corp"), return a raw JSON object:
         {
           "action": "lookup_customer_history",
           "customerId": "exact_id_from_context"
         }

      5. If the user wants a REPORT, SUMMARY, or DAILY OVERVIEW (e.g., "End of day report", "Daily summary", "Stats for today"), return a raw JSON object:
         {
           "action": "generate_report",
           "period": "today"
         }

      6. For general analysis or questions, provide a helpful, professional plain text response. Do not use Markdown formatting for the JSON blocks.
      `
    });

    return response.text || "No response generated.";
  } catch (error) {
    console.error("AI Error:", error);
    return "Sorry, I encountered an error communicating with the AI service.";
  }
};

export const generateMockData = async (): Promise<{ products: Product[], customers: Customer[] } | null> => {
  if (!apiKey) return null;

  try {
    const prompt = `Generate realistic mock data for an ERP system.
    Return ONLY a raw JSON object (no markdown formatting) with two keys: "products" (array of 5 items) and "customers" (array of 3 items).
    
    Product schema: { id, sku, name, category, price (number), stock (number), reorder_level (number) }
    Customer schema: { id, name, email, phone, company }
    
    Ensure IDs are unique strings.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Mock Data Error:", error);
    return null;
  }
};