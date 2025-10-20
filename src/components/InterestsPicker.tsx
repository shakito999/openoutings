"use client"
import { useEffect, useState } from 'react'

export default function InterestsPicker({ all, selected, onChange }:{ all:string[]; selected:string[]; onChange:(s:string[])=>void }){
  const [value, setValue] = useState<string[]>(selected)
  useEffect(()=>{ onChange(value) },[value])
  return (
    <div className="flex flex-wrap gap-2">
      {all.map(i => {
        const active = value.includes(i)
        return (
          <button
            key={i}
            type="button"
            onClick={()=> setValue(v => active ? v.filter(x=>x!==i) : [...v,i])}
            className={`px-4 py-2 rounded-full border font-medium transition-all ${
              active
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent shadow-md shadow-blue-500/30 scale-105'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {i}
          </button>
        )
      })}
    </div>
  )
}
