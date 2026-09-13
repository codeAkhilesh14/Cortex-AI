import { Code2, FileText, Globe, ImageIcon, MessageSquare, Mic, MicOff, Paperclip, Presentation, Send, X, Zap } from 'lucide-react'
import React, { useState, useRef, useEffect } from 'react'
import sendMessage from '../features/sendMessage'
import { useDispatch, useSelector } from 'react-redux'
import { addMessage, setArtifacts, setConversationLoading } from '../redux/messageSlice'
import { createConversation } from '../features/createConversation'
import { addConversation, setConvTitle, setSelectedConversation } from '../redux/conversationSlice'
import { updateConversation } from '../features/updateConversation'

const ChatInput = () => {
  
  const [value, setValue] = useState("")
  const [selectedAgent, setSelectedAgent] = useState("Auto")
  const [selectedFile, setSelectedFile] = useState(null)
  const [filePreviewUrl, setFilePreviewUrl] = useState("")
  const [listening, setListening] = useState(false)

  const recognitionRef = useRef(null) // this will help to access recorded voice to use anywhere

  const fileRef = useRef(null)

  const dispatch = useDispatch()

  const { selectedConversation } = useSelector(state=>state.conversation) 
  const { loadingByConversation } = useSelector(state=>state.message)
  const isCurrentConversationLoading = Boolean(loadingByConversation[selectedConversation?._id])

  useEffect(()=>{
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!SpeechRecognition) return;

    const recognition = new SpeechRecognition()
    recognition.lang = "en-US"
    recognition.interimResults = true
    recognition.continous = true
    recognition.onresult = (event) => {
      let transcript = ""
      for (let index = event.resultIndex; index < event.results.length; index++) {
        transcript += event.results[index][0].transcript
      }
      setValue(transcript)
    }
    recognition.onend = () => {
      setListening(false)
    }
    recognitionRef.current = recognition
  }, [])

  const toggleMic = () => {
    if(!recognitionRef.current) {
      alert("Speech Recognition not supported")
    } 
    if(listening) {
      recognitionRef.current.stop()
      setListening(false)
    } else {
      recognitionRef.current.start()
      setListening(true)
    }
  }

  useEffect(() => {
    if (!selectedFile?.type?.startsWith("image/")) {
      setFilePreviewUrl("")
      return
    }

    const previewUrl = URL.createObjectURL(selectedFile)
    setFilePreviewUrl(previewUrl)

    return () => URL.revokeObjectURL(previewUrl)
  }, [selectedFile])

  const handleSendMessage = async () => {
    if(!value.trim() || isCurrentConversationLoading) return

    let conversation = selectedConversation
    const prompt = value.trim()

    try {
      if(!conversation) {
        const conv = await createConversation()
        dispatch(setSelectedConversation(conv))
        dispatch(addConversation(conv))
        conversation = conv
      }

      if(conversation.title=="New Chat") {
        await updateConversation({id: conversation?._id, title: prompt})
        dispatch(setConvTitle({conversationId: conversation?._id, title: prompt.slice(0, 40)}))
      }

      const formData = new FormData()
      formData.append("prompt", prompt)
      formData.append("conversationId", conversation?._id)
      formData.append("agent", selectedAgent.toLowerCase())
      if(selectedFile) {
        formData.append("file", selectedFile)
      }

      dispatch(addMessage({role: "user", content: prompt}))
      dispatch(setConversationLoading({conversationId: conversation?._id, loading: true}))
      setValue("")

      const data = await sendMessage(formData)
      setSelectedFile(null)

      if(data) {
        dispatch(setArtifacts(data.artifacts || []))
        dispatch(addMessage({role: "assistant", content: data?.answer, images: data?.images}))
      } else {
        dispatch(addMessage({role: "assistant", content: "Something went wrong. Please try again."}))
      }

      console.log(data)
    } finally {
      dispatch(setConversationLoading({conversationId: conversation?._id, loading: false}))
    }
  }

  const agents = [
    {
      id: "auto",
      icon: Zap,
      label: "Auto"
    },
    {
      id: "chat",
      icon: MessageSquare,
      label: "Chat"
    },
    {
      id: "coding",
      icon: Code2,
      label: "Coding"
    },
    {
      id: "pdf",
      icon: FileText,
      label: "PDF"
    },
    {
      id: "ppt",
      icon: Presentation,
      label: "PPT"
    },
    {
      id: "vision",
      icon: ImageIcon,
      label: "Vision"
    },
    {
      id: "search",
      icon: Globe,
      label: "Search"
    }
  ]

  return (
    <div className='w-full overflow-hidden px-3 md:px-5 py-4 border-t border-white/6 bg-[#0d0f14]'>
      <div className='flex flex-col gap-2 bg-white/3 border border-white/[0.07] rounded-2xl px-4 pt-3.5 pb-3'>
        <div className="flex w-[80%] gap-2 pr-2 flex-wrap">
          {
            agents.map((agent)=>{
              const isActive=selectedAgent===agent.label
              const Icon = agent.icon
              return (
                <div 
                onClick={()=>setSelectedAgent(agent.label)}
                className={`shrink-0 cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium border transition-all 
                ${
                    isActive
                      ? "bg-linear-to-r from-indigo-500 to-violet-600 text-white border-transparent shadow-[0_1px_8px_rgba(99,102,241,.35)]"
                      : "bg-white/3 text-slate-400 border-white/6 hover:bg-white/[0.07]"
                }`}>
                  <Icon size={14} className={isActive ? "text-white" : "text-slate-500"} />
                  {agent.label}
                </div>  
              )
            })
          }
        </div>

          {selectedFile && (
            <div className="my-3 inline-flex w-fit max-w-full self-start items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-[#151922]">
                {selectedFile?.type === "application/pdf" ? (
                  <FileText size={19} className="text-red-400" />
                ) : (
                  filePreviewUrl && (
                    <img
                      src={filePreviewUrl}
                      className="h-full w-full object-cover"
                      alt={selectedFile?.name}
                    />
                  )
                )}
              </div>
              <div className="min-w-0 max-w-[150px] pr-1">
                <p className="truncate text-xs font-medium leading-4 text-white">
                  {selectedFile?.name}
                </p>
                <p className="text-[10px] leading-3 text-slate-500">
                  {Math.ceil(selectedFile.size / 1024)}KB
                </p>
              </div>
              <button
                type="button"
                aria-label="Remove uploaded file"
                className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-500 transition-all hover:bg-white/7 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/15 cursor-pointer"
                onClick={() => {
                  setSelectedFile(null)
                  fileRef.current.value = ""
                }}
              >
                <X size={15} strokeWidth={2} />
              </button>
            </div>
          )}

        <textarea
          onChange={(e)=>setValue(e.target.value)}
          value={value}
          placeholder='Ask Anything...'
          className="w-full bg-transparent outline-none resize-none text-[14px] text-slate-200 placeholder:text-slate-600 leading-relaxed [scrollbar-none] [&::-webkit-scrollbar]:hidden disabled:opacity-50"
          rows={3}
        />

        <div className='flex items-center justify-between'>
          <div className="flex items-center gap-1">
            <input type="file" accept=".pdf,image/*" hidden ref={fileRef} onChange={(e)=>{
              const file = e.target.files[0]
              if(file) {
                setSelectedFile(file)
              }  
            }} />
            <button className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 hover:text-slate-400
            hover:bg-white/5 border border-transparent hover:border-white/6 transition-all duration-150 bg-transparent cursor-pointer"
            onClick={()=>fileRef.current.click()}>
              <Paperclip size={16} />
            </button>
            <button className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150 cursor-pointer 
            ${listening ? "bg-red-500 text-white" : "text-slate-600 hover:bg-white/5"}`}
            onClick={toggleMic}>
              {listening ? <Mic size={16} /> : <MicOff size={16} />}
            </button>
          </div>
          <button 
          disabled={!value.trim() || isCurrentConversationLoading}
          onClick={handleSendMessage}
          className={`flex items-center justify-center w-8 h-8 rounded-lg border-none cursor-pointer transition-all duration-150
          ${value.trim() && !isCurrentConversationLoading ? "bg-linear-to-br from-indigo-500 to-violet-700 hover:opacity-90 text-white" : "bg-white/5 text-slate-600 cursor-not-allowed"}`}>
            <Send size={15} />
          </button>
        </div>  
      </div>
    </div>
  )
}

export default ChatInput
