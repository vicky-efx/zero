export interface Message {
  id?: string;        // Firestore document ID (optional)
  from: string;       // Sender user ID
  to: string;         // Receiver user ID
  participants: string[]; // Both user IDs (for easy query)
  content: string;    // The actual message text
  timestamp: number;  // Unix timestamp (milliseconds)
}
