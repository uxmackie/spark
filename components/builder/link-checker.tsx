'use client'
import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { repairLink, type LinkIssue } from '@/lib/link-checker'
type Report = {issues:LinkIssue[];checked:number;skipped:number;targets:{title:string;href:string;draft:boolean;headings:{title:string;id:string}[]}[]}
export function LinkChecker({source,slug,product,title,draft,disabled,onChange}:{source:string;slug:string;product:string;title:string;draft:boolean;disabled:boolean;onChange:(source:string)=>void}) {
  const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('')
  const [report,setReport]=useState<Report|null>(null),[snapshot,setSnapshot]=useState(''),[replacement,setReplacement]=useState(''),[selected,setSelected]=useState<number|null>(null)
  async function scan() {
    setBusy(true);setError('');setReport(null);setSelected(null)
    try {
      const response=await fetch('/api/builder/links',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({source,slug,product,title,draft})})
      const data=await response.json();if(!response.ok)throw new Error(data.error || 'Could not check links')
      setReport(data);setSnapshot(source)
    } catch(e){setError((e as Error).message)}finally{setBusy(false)}
  }
  const stale=source!==snapshot
  return <><button type="button" disabled={disabled} onClick={()=>{setOpen(true);void scan()}}>Check links</button><Dialog open={open} onOpenChange={setOpen}><DialogContent className="studio-dialog studio-link-checker sm:max-w-xl"><DialogTitle>Check this page’s links</DialogTitle><DialogDescription>Checks your latest edits against project pages, draft status, and headings. External URLs and non-docs routes are skipped.</DialogDescription>
    {busy && <p role="status">Checking links…</p>}{error && <p role="alert">{error}</p>}
    {report && <><p role="status">{report.checked} checked · {report.issues.length} issues · {report.skipped} skipped</p>{stale && <p>Page changed. Check again before applying another repair.</p>}
      {report.issues.map((issue,index)=><section key={index}><strong>{issue.reason}</strong><code>{issue.href}</code><small>Line {issue.line}</small><button type="button" disabled={stale||busy} onClick={()=>{setSelected(index);setReplacement(issue.href)}}>Replace link</button>
        {selected===index && <div><label>Destination<input value={replacement} onChange={e=>setReplacement(e.target.value)} placeholder="Search pages or type /docs/product/page#heading" /></label><div className="studio-link-targets">{report.targets.filter(t=>!t.draft && (!replacement || `${t.title} ${t.href}`.toLowerCase().includes(replacement.toLowerCase()) || replacement===issue.href)).slice(0,8).map(t=><div key={t.href}><button type="button" onClick={()=>setReplacement(t.href)}>{t.title}<small>{t.href}</small></button>{replacement.startsWith(t.href) && t.headings.map(h=><button type="button" key={h.id} onClick={()=>setReplacement(`${t.href}#${h.id}`)}>↳ {h.title}</button>)}</div>)}</div><button type="button" disabled={stale||busy||!replacement} onClick={()=>{try{onChange(repairLink(source,issue,replacement.trim()));setSelected(null);setError('')}catch(e){setError((e as Error).message)}}}>Apply to editor</button></div>}
      </section>)}{!report.issues.length && <p>No broken internal docs links found.</p>}</>}
    <button type="button" disabled={busy} onClick={()=>void scan()}>Check again</button><small>Repairs update the editor. Save the page to write them to your project.</small>
  </DialogContent></Dialog></>
}
