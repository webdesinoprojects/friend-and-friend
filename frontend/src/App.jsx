import AppRoutes from "./routes/AppRoutes";
import { FeedbackHost } from "./components/common/Feedback";
import NotificationCenter from "./components/common/NotificationCenter";

export default function App() {
  return <><AppRoutes /><NotificationCenter /><FeedbackHost /></>;
}
