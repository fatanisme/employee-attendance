import { ThemeProvider } from 'next-themes'
import EmployeeAttendance from './components/EmployeeAttendance'

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="App">
        <EmployeeAttendance />
      </div>
    </ThemeProvider>
  )
}

export default App