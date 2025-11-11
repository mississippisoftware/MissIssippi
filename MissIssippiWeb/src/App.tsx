import { Outlet } from "react-router-dom"
import MySidebar from "./Components/SideBar"


function App() {


  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <MySidebar />
      <div style={{ flexGrow: 1, padding: '2rem' }}>
        <Outlet />
      </div>
    </div>
  )
}

export default App
