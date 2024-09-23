"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Trash2, Menu, Plus, Sun, Moon } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useTheme } from 'next-themes'

interface AttendanceRecord {
  id: string
  date: string
  tapInTime: string
  tapOutTime: string
  activities: string[]
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

export default function EmployeeAttendance() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [newActivity, setNewActivity] = useState("")
  const [isTappedIn, setIsTappedIn] = useState(false)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [editingActivity, setEditingActivity] = useState<{ recordId: string, index: number, text: string } | null>(null)
  const [currentDate, setCurrentDate] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    const storedRecords = localStorage.getItem('attendanceRecords')
    if (storedRecords) {
      setRecords(JSON.parse(storedRecords))
    }
    const storedTapStatus = localStorage.getItem('isTappedIn')
    if (storedTapStatus) {
      setIsTappedIn(JSON.parse(storedTapStatus))
    }
    updateCurrentDate()

    // Set up interval for auto tap-out
    const interval = setInterval(checkForAutoTapOut, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    localStorage.setItem('attendanceRecords', JSON.stringify(records))
  }, [records])

  useEffect(() => {
    localStorage.setItem('isTappedIn', JSON.stringify(isTappedIn))
  }, [isTappedIn])

  const updateCurrentDate = () => {
    const now = new Date()
    setCurrentDate(formatDate(now.toISOString()))
    setSelectedDate(now.toISOString().split('T')[0])
  }

  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0]
  }

  const getCurrentTime = () => {
    const now = new Date()
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const day = days[date.getDay()]
    const dd = date.getDate()
    const monthName = months[date.getMonth()]
    const yyyy = date.getFullYear()
    return `${day}, ${dd} ${monthName} ${yyyy}`
  }

  const checkForAutoTapOut = () => {
    const now = new Date()
    if (now.getHours() === 23 && now.getMinutes() === 59 && now.getSeconds() === 59) {
      const currentDate = getCurrentDate()
      const todayRecord = records.find(record => record.date === currentDate)
      if (todayRecord && !todayRecord.tapOutTime) {
        handleTapOut()
      }
    }
  }

  const handleTapIn = () => {
    const currentDate = getCurrentDate()
    const todayRecord = records.find(record => record.date === currentDate)
    if (!todayRecord) {
      const newRecord: AttendanceRecord = {
        id: Date.now().toString(),
        date: currentDate,
        tapInTime: getCurrentTime(),
        tapOutTime: "",
        activities: []
      }
      setRecords([...records, newRecord])
      setIsTappedIn(true)
      updateCurrentDate()
    }
  }

  const handleTapOut = () => {
    const currentDate = getCurrentDate()
    const todayRecord = records.find(record => record.date === currentDate)
    if (todayRecord && !todayRecord.tapOutTime) {
      const updatedRecords = records.map(record =>
        record.id === todayRecord.id ? { ...record, tapOutTime: getCurrentTime() } : record
      )
      setRecords(updatedRecords)
      setIsTappedIn(false)
      updateCurrentDate()
    }
  }

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault()
    if (newActivity && selectedDate) {
      const selectedRecord = records.find(record => record.date === selectedDate)
      if (selectedRecord && selectedRecord.tapInTime) {
        const updatedRecords = records.map(record =>
          record.id === selectedRecord.id
            ? { ...record, activities: [...record.activities, newActivity] }
            : record
        )
        setRecords(updatedRecords)
        setNewActivity("")
      }
    }
  }

  const handleEditTime = (record: AttendanceRecord, field: 'tapInTime' | 'tapOutTime', newTime: string) => {
    const updatedRecords = records.map(r => 
      r.id === record.id ? { ...r, [field]: newTime } : r
    )
    setRecords(updatedRecords)
  }

  const handleEditActivity = (recordId: string, index: number, newText: string) => {
    const updatedRecords = records.map(record => 
      record.id === recordId
        ? { ...record, activities: record.activities.map((activity, i) => i === index ? newText : activity) }
        : record
    )
    setRecords(updatedRecords)
    setEditingActivity(null)
  }

  const handleDeleteActivity = (recordId: string, index: number) => {
    const updatedRecords = records.map(record => 
      record.id === recordId
        ? { ...record, activities: record.activities.filter((_, i) => i !== index) }
        : record
    )
    setRecords(updatedRecords)
    setEditingActivity(null)
  }

  const handleDeleteRecord = (recordId: string) => {
    const recordToDelete = records.find(record => record.id === recordId)
    const updatedRecords = records.filter(record => record.id !== recordId)
    setRecords(updatedRecords)

    if (recordToDelete && recordToDelete.date === getCurrentDate()) {
      setIsTappedIn(false)
    }
  }

  const toggleYear = (year: number) => {
    if (selectedYear === year) {
      setSelectedYear(null)
      setSelectedMonth(null)
    } else {
      setSelectedYear(year)
      setSelectedMonth(null)
    }
  }

  const filteredRecords = records.filter(record => {
    const recordDate = new Date(record.date)
    return (selectedYear === null || recordDate.getFullYear() === selectedYear) &&
           (selectedMonth === null || recordDate.getMonth() === selectedMonth)
  })

  const canAddActivity = () => {
    const selectedRecord = records.find(record => record.date === selectedDate)
    return selectedDate !== "" && 
           newActivity.trim() !== "" && 
           selectedRecord?.tapInTime !== undefined
  }

  const getExistingYearsAndMonths = () => {
    const yearsAndMonths: { [year: number]: number[] } = {}
    records.forEach(record => {
      const date = new Date(record.date)
      const year = date.getFullYear()
      const month = date.getMonth()
      if (!yearsAndMonths[year]) {
        yearsAndMonths[year] = []
      }
      if (!yearsAndMonths[year].includes(month)) {
        yearsAndMonths[year].push(month)
      }
    })
    return yearsAndMonths
  }

  const Sidebar = () => {
    const existingYearsAndMonths = getExistingYearsAndMonths()
    const years = Object.keys(existingYearsAndMonths).map(Number).sort((a, b) => b - a)

    return (
      <div className="bg-amber-200 dark:bg-amber-800 p-4 h-full overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-amber-800 dark:text-amber-200">Years</h2>
        {years.map((year) => (
          <div key={year}>
            <Button
              onClick={() => toggleYear(year)}
              className={`w-full mb-2 ${selectedYear === year ? 'bg-amber-600' : 'bg-amber-400'} hover:bg-amber-500 text-white`}
            >
              {year}
            </Button>
            {selectedYear === year && (
              <div className="ml-4">
                {existingYearsAndMonths[year].sort((a, b) => a - b).map((monthIndex) => (
                  <Button
                    key={monthIndex}
                    onClick={() => setSelectedMonth(monthIndex)}
                    className={`w-full mb-2 ${selectedMonth === monthIndex ? 'bg-amber-600' : 'bg-amber-400'} hover:bg-amber-500 text-white`}
                  >
                    {months[monthIndex]}
                  </Button>
                ))}
              </div>
            )}
          </div>
        ))}
        <Button
          onClick={() => {
            setSelectedYear(null)
            setSelectedMonth(null)
          }}
          className="w-full mt-4 bg-amber-700 hover:bg-amber-800 text-white"
        >
          Show All
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-amber-100 dark:bg-amber-900 font-mono">
      <div className="hidden md:block md:w-64 h-screen overflow-y-auto">
        <Sidebar />
      </div>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden absolute top-4 left-4">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-center text-amber-800 dark:text-amber-200">Retro Employee Attendance</h1>
          <Button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            variant="outline"
            size="icon"
          >
            {theme === 'dark' ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
          </Button>
        </div>
        
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="flex justify-center space-x-4 mb-4">
            <Button 
              onClick={handleTapIn} 
              disabled={isTappedIn || records.some(record => record.date === getCurrentDate())}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              Tap In
            </Button>
            <Button 
              onClick={handleTapOut} 
              disabled={!isTappedIn || records.some(record => record.date === getCurrentDate() && record.tapOutTime)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Tap Out
            </Button>
          </div>
          <p className="text-lg font-semibold text-amber-800 dark:text-amber-200">{currentDate}</p>
        </div>

        <form onSubmit={handleAddActivity} className="mb-8 flex flex-col sm:flex-row justify-center items-center">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="mr-0 sm:mr-2 mb-2 sm:mb-0 p-2 border border-amber-400 rounded w-full sm:w-auto"
          />
          <Input
            type="text"
            value={newActivity}
            onChange={(e) => setNewActivity(e.target.value)}
            placeholder="Enter activity"
            className="mr-0 sm:mr-2 mb-2 sm:mb-0 p-2 border border-amber-400 rounded w-full sm:w-auto"
          />
          <Button 
            type="submit"
            disabled={!canAddActivity()}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Activity
          </Button>
        </form>

        <div className="overflow-x-auto">
          <Table className="w-full bg-amber-50 dark:bg-amber-800 border-collapse border border-amber-300 dark:border-amber-700">
            <TableHeader>
              <TableRow>
                <TableHead className="border border-amber-300 dark:border-amber-700 px-4 py-2 text-amber-800 dark:text-amber-200">Date</TableHead>
                <TableHead className="border border-amber-300 dark:border-amber-700 px-4 py-2 text-amber-800 dark:text-amber-200">Tap In Time</TableHead>
                <TableHead className="border border-amber-300 dark:border-amber-700 px-4 py-2 text-amber-800 dark:text-amber-200">Tap Out Time</TableHead>
                <TableHead className="border border-amber-300 dark:border-amber-700 px-4 py-2 text-amber-800 dark:text-amber-200">Activities</TableHead>
                <TableHead className="border border-amber-300 dark:border-amber-700 px-4 py-2 text-amber-800 dark:text-amber-200">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="border border-amber-300 dark:border-amber-700 px-4 py-2 text-amber-800 dark:text-amber-200">{formatDate(record.date)}</TableCell>
                  <TableCell className="border border-amber-300 dark:border-amber-700 px-4 py-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="link" className="text-amber-800 dark:text-amber-200">{record.tapInTime || "Set Time"}</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Tap In Time</DialogTitle>
                        </DialogHeader>
                        <Input
                          type="time"
                          defaultValue={record.tapInTime}
                          onChange={(e) => handleEditTime(record, 'tapInTime', e.target.value)}
                        />
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                  <TableCell className="border border-amber-300 dark:border-amber-700 px-4 py-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="link" className="text-amber-800 dark:text-amber-200">{record.tapOutTime || "Set Time"}</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Tap Out Time</DialogTitle>
                        </DialogHeader>
                        <Input
                          type="time"
                          defaultValue={record.tapOutTime}
                          onChange={(e) => handleEditTime(record, 'tapOutTime', e.target.value)}
                        />
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                  <TableCell className="border border-amber-300 dark:border-amber-700 px-4 py-2">
                    <ol className="list-decimal list-inside">
                      {record.activities.map((activity, idx) => (
                        <li key={idx} className="text-amber-800 dark:text-amber-200">
                          {editingActivity && editingActivity.recordId === record.id && editingActivity.index === idx ? (
                            <form onSubmit={(e) => {
                              e.preventDefault()
                              handleEditActivity(record.id, idx, editingActivity.text)
                            }} className="flex items-center flex-wrap">
                              <Input
                                type="text"
                                value={editingActivity.text}
                                onChange={(e) => setEditingActivity({ ...editingActivity, text: e.target.value })}
                                className="mr-2 p-1 border border-amber-400 rounded flex-grow"
                              />
                              <div className="flex mt-2">
                                <Button type="submit" className="bg-green-500 text-white p-1 rounded mr-2">Save</Button>
                                <Button 
                                  type="button" 
                                  onClick={() => handleDeleteActivity(record.id, idx)}
                                  className="bg-red-500 text-white p-1 rounded"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </form>
                          ) : (
                            <span onClick={() => setEditingActivity({ recordId: record.id, index: idx, text: activity })}>
                              {activity}
                            </span>
                          )}
                        </li>
                      ))}
                    </ol>
                  </TableCell>
                  <TableCell className="border border-amber-300 dark:border-amber-700 px-4 py-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">Delete</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the attendance record.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteRecord(record.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}