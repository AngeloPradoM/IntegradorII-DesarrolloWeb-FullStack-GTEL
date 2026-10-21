import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { NotificationProvider } from "./context/NotificationContext";
import ToastNotifications from "./components/ui/ToastNotifications";
import AppRoutes from "./routes/AppRoutes";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
          <ToastNotifications />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;