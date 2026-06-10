export interface Prayer {
  id: string;
  senderName: string;
  prayerText: string;
  isRead: boolean;
  createdAt: any; // Firestore Timestamp, ISO string, or number
  updatedAt: any;
}
