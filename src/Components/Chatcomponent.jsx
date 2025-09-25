import { form, pre, s } from 'motion/react-client'
import React, { useEffect, useRef, useState } from 'react'
import { BiClipboard, BiDownload, BiSun } from 'react-icons/bi'
import { BsArrowDown, BsArrowUp } from 'react-icons/bs'
import { FaCopy, FaDownload, FaMoon, FaSun } from 'react-icons/fa'
import { MdOutlineDangerous } from 'react-icons/md'
import ReactMarkdown from 'react-markdown'
import { Link } from 'react-router-dom'

const Chatcomponent = () => {
  const [input, setInput] = useState("")
  const [rollNo, setRollNo] = useState("")
  // const [sendChat, setSendChat] = useState(false)
  const [copiedIndex,setCopiedIndex]=useState(null)
  // const [welcomeMsg, setWelcomeMsg] = useState(false)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [copied, setcopied] = useState(false)
  const [open, setOpen] = useState("flex")
  const [isClosing, setIsClosing] = useState(false)
  const [dark, setIsDark] = useState(false)
  const [showDownloadModal, setShowDownloadModal] = useState(false)

  const messagecontainerRef = useRef(null)
  const inpRef = useRef(null)

  const downloadReport = (format) => {
    if (!format) return
    if (messages.length === 0) return alert("No messages to download")
    const handledownload = window.confirm("Are you sure you want to download the chat history?")
    if (format === "json" && handledownload) {
      const blob = new Blob([JSON.stringify(messages, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `chat_history_${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
    if (format === "csv" && handledownload) {
      let headers = "role,content\n"
      messages.map(msg => (
        headers += `${msg.role},"${msg.content.replace(/"/g, '""')}"\n`
      ))
      let anchor = document.createElement('a')
      anchor.href = 'data:text/csv;charset=utf-8, ' + encodeURI(headers)
      anchor.target = '_blank'
      anchor.download = `chat_history_${Date.now()}.csv`
      anchor.click()
      anchor.remove()
    }
  }

  const sendMessage = async () => {
    if (!rollNo) return alert("Please enter your roll no")

    if (!input.trim()) return alert("Please enter your message")
         const userMsg = { role: "user", content: input, timestamp: new Date() }
    const assistantMessage = { role: "assistant", content: "", timestamp: new Date(), error: false }


      if(!navigator.onLine){
        const assistantMessage={
          role:"assistant",
          content:"You are offline. Please check your internet connection.",
          timestamp:new Date(),
          error:true
        }
        setMessages(prev=>[...prev,assistantMessage])
        setLoading(false)
        return
        // return alert("You are offline. Please check your internet connection.")

      }

    setLoading(true)
    // setSendChat(true)
    // setWelcomeMsg(true)

 
    setMessages(prev => [...prev, userMsg])
    if (inpRef.current) { inpRef.current.textContent = "" }
    setInput("")

    try {
      const response = await fetch('https://millions-screeching-vultur.mastra.cloud/api/agents/weatherAgent/stream', {
        method: 'POST',
        headers: {
          "Accept": "*/*",
          "Content-Type": "application/json",
          "x-mastra-dev-playground": 'true'
        },
        body: JSON.stringify({
          "messages": [{ "role": "user", "content": input }],
          "runId": "weatherAgent",
          "maxRetries": 2,
          "maxSteps": 5,
          "temperature": 0.5,
          "topP": 1,
          "runtimeContext": {},
          "threadId": rollNo,
          "resourceId": "weatherAgent"
        })
      })

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      setMessages(prev => [...prev, assistantMessage])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const decodedChunk = decoder.decode(value, { stream: true })
        const lines = decodedChunk.split('\n').filter(line => line.trim() !== "")

        for (const line of lines) {
          try {
            let chunkTextMessage = ""

            if (line.startsWith("{") || line.startsWith("[")) {
              const data = JSON.parse(line)
              if (data["0"]) {
                chunkTextMessage += data["0"]
              }
            } else if (line.startsWith("0:")) {
              chunkTextMessage = line.slice(2).trim().replace(/^"|"$/g, "")
            }

            if (chunkTextMessage) {
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: updated[updated.length - 1].content + chunkTextMessage
                }
                return updated
              })
            }
            setTimeout(() => { setLoading(false) }, 2500)
          } catch (error) {
            console.error("Error parsing line:", line)
            console.error(error)
            setLoading(false)
          }
        }
      }

      // setSendChat(false)
    } catch (error) {
      console.error(error)
      // mark only the last assistant bubble as error
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { ...updated[updated.length - 1], error: true }
        return updated
      })
      setLoading(false)
    }
  }

  useEffect(() => {
    if (messagecontainerRef.current) {
      messagecontainerRef.current.scrollTop = messagecontainerRef.current.scrollHeight
    }
  }, [messages])

  const closeModal = () => {
    if (!rollNo) return alert("Please enter your roll no")
    setIsClosing(true)
    setTimeout(() => {
      setOpen("hidden")
    }, 2000)
  }

  return (
    <div className="flex h-screen w-full relative">

      {/* Download Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white  rounded-xl shadow-lg p-6 w-72 md:w-96 flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-black">Export Chat History</h2>
            <p className="text-gray-900 ">Choose a format to download:</p>
            <div className="flex gap-4">
              <button
                onClick={() => { downloadReport('csv'); setShowDownloadModal(false); }}
                className="flex-1 px-4 py-2 rounded-full bg-green-500 shadow-md text-white font-semibold hover:bg-green-600 transition"
              >
                CSV
              </button>
              <button
                onClick={() => { downloadReport('json'); setShowDownloadModal(false); }}
                className="flex-1 px-4 py-2 rounded-full bg-yellow-400 text-black shadow-md font-semibold hover:bg-yellow-500 transition"
              >
                JSON
              </button>
            </div>
            <button
              onClick={() => setShowDownloadModal(false)}
              className="mt-2 text-gray-500 hover:text-gray-800 transition self-end"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Initial Roll No Modal */}
      <div
        className={`  ${isClosing ? "opacity-0" : "opacity-100"} ${open}  gap-10 justify-center text-center p-5  items-center flex-col fixed top-0 left-0 h-screen w-full z-50 bg-white transition-opacity duration-500 
  `}
      >
        <p className=" text-3xl md:text-6xl">Kindly Fill Your Details</p>
        <input onKeyDown={e=>{if(e.key=='Enter' && !e.shiftKey){closeModal()}}} value={rollNo} className='focus:outline-none rounded-full shadow-xl p-5 text-2xl md:text-3xl w-fit  ml-2 ' placeholder='Enter your roll no' onChange={e => setRollNo(e.target.value)} type="number" />
        <button onClick={closeModal}  className="px-8 py-5 rounded-full text-white font-semibold text-xl md:text-2xl
  bg-gradient-to-b from-[#042db2] to-[#A3BFFF] 
  shadow-md hover:shadow-lg transition-all duration-300">
          Proceed
        </button>
      </div>

      {/* Chat Section */}
      <div className={`p-2 h-screen w-full ${dark ? 'bg-gradient-to-bl from-[#000000] via-[#3F39BB] to-[#000000]' : 'bg-[url("/Bg.svg")] bg-center bg-no-repeat bg-cover'} transition-all ease-in-out flex flex-col`}>

        {/* Header */}
        <div className="w-full p-6 flex gap-6 shadow-sm shadow-neutral-800 justify-between bg-[#5A5858]/20 overflow-x-hidden backdrop-blur-md rounded-t-md">
          <Link to={'/'} className={`flex gap-3 items-center ${dark ? 'text-white' : 'text-black'}`}>
            <div className="h-7 w-7 rounded-full bg-white p-1 flex items-center justify-center">
              <img src="/Logo.png" alt="logo" className="h-full w-full object-contain" />
            </div>
            <p className='text-xl font-bold'>Weatherly</p>
          </Link>
          <div className="relative w-40 md:w-52 lg:w-60">
            <button
              onClick={() => setShowDownloadModal(true)}
              className="md:px-4 px-2 md:text-lg text-xs flex gap-2 whitespace-nowrap w-fit items-center py-2 rounded-full bg-gradient-to-r from-[#6589FF] to-[#A3BFFF] text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300"
            >
              <span>Export Chat</span>
              <span><BsArrowDown /></span>
            </button>
          </div>
          <div onClick={() => setIsDark(!dark)} className="cursor-pointer text-black text-lg flex items-center justify-center h-10 w-10 rounded-full bg-white">
            {dark ? <BiSun /> : <FaMoon />}
          </div>
        </div>

        {/* Messages */}
        <div style={{ scrollBehavior: 'smooth' }} ref={messagecontainerRef} className="flex-1 chatContainer bg-[#5A5858]/25 mt-2 backdrop-blur-md p-5 relative rounded-t-md overflow-x-hidden  shadow-sm shadow-neutral-800  overflow-y-auto">
          {messages.length===0 && <div className="w-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2">
            <p className={`${dark ? 'text-white' : 'text-black'} text-3xl text-center`}>How can I help you today?</p>
          </div>}

          {messages?.map((msg, idx) => (
            <div
              key={idx}
              className={`w-full flex ${msg.role === "user" ? "justify-end" : "justify-start"} p-1`}
            >
              {msg.role === "user" ? (
                <div
                  className={`py-2 px-5 rounded-xl border-2 max-w-[80%] whitespace-pre-wrap break-words
        ${dark
                      ? "border-white/30 bg-neutral-800 text-white"
                      : "border-black/30 bg-white text-black"}`}
                >
                  <p>{msg.content}</p>
                  <span className="block text-xs text-gray-400 mt-1 text-right">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ) : (
                <div
                  className={`py-2 px-5 border rounded-xl max-w-[80%]
        ${dark
                      ? "bg-gradient-to-bl from-[#5454548A] to-transparent border-gray-600 text-white"
                      : "bg-gray-100 border-black/30 text-black"}`}
                >
                  {msg.error ? (
                    <div className="text-red-600 flex items-center gap-2">
                      <MdOutlineDangerous /> Something went wrong
                    </div>
                  ) :loading && idx===messages.length-1? (
                    <span className="flex gap-3 animate-pulse">
                      <div className="h-5 w-5 rounded-full p-1">
                        <img src="/Logo.png" alt="" className="h-full w-full object-cover" />
                      </div>
                      Assistant is typing...
                    </span>
                  ) : (
                    <ReactMarkdown>{msg.content.replaceAll(/\\n/g, "\n")}</ReactMarkdown>
                  )}

                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-400">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span
                      className="cursor-pointer ml-2"
                      onClick={() => {
                        navigator.clipboard.writeText(msg.content)
                        setCopiedIndex(idx)
                        setTimeout(() => setCopiedIndex(null), 1000)
                      }}
                    >
                      {copiedIndex===idx ? "Copied ✓ " : <FaCopy />}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="w-full flex gap-2 p-3 bg-[#5A5858]/30 backdrop-blur-md relative rounded-b-md">
          <div
            ref={inpRef}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                if (!loading) {
                  e.preventDefault()
                  sendMessage()
                }
              }
            }}
            onInput={e => setInput(e.currentTarget.textContent)}
            onPaste={e => {
              e.preventDefault()
              const text = e.clipboardData.getData('text/plain')
              document.execCommand("insertText", false, text)
            }}
            // contentEditable={!lo}
            contentEditable={!loading}
            className='flex-1 p-3 rounded-md text-white outline-none border border-gray-300 focus:border-indigo-500 transition-all duration-300'
          />
          {input === "" ? (
            <span className={`${!dark ? 'text-white' : 'text-gray-400'} absolute -z-10 left-7 top-1/2 -translate-y-1/2`}>Type a message...</span>
          ) : ''}
          <button onClick={sendMessage} className="h-10 w-10 p-2 flex items-center justify-center mt-2 rounded-full bg-indigo-500 text-white hover:bg-indigo-600 transition">
            <BsArrowUp className='rotate-45' />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Chatcomponent
