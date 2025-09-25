import React from 'react'
import { BsArrowUpRight } from 'react-icons/bs'
import { Link } from 'react-router-dom'

const Navbar = () => {
  return (
   <div className="w-full flex p-5 absolute top-0 left-0 justify-between items-center ">
    <div className="flex items-center gap-2">
      <img src="Logo.png" alt="logo" className="h-8 w-8"/>
      <span className="text-xl text-tracking">Weatherly</span>
      
    </div>
   <Link to={'/chat'} className=' flex items-center gap-1 w-fit underline'><span>Chat</span> <span className='underline'><BsArrowUpRight /></span></Link>
   </div>
  )
}

export default Navbar