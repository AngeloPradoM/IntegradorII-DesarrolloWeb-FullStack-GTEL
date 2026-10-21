import { useEffect, useState } from 'react';
import { recruiterErrorMessage } from '../services/recruiterService';

export default function useRecruiterData(load) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({load:null, attempt:-1, data:null, error:''});
  const loading = result.load !== load || result.attempt !== attempt;
  useEffect(() => {
    let active = true;
    Promise.resolve().then(load).then(data=>{
      if (active) setResult({load, attempt, data, error:''});
    }).catch(error=>{
      if (active) setResult({load, attempt, data:null, error:recruiterErrorMessage(error)});
    });
    return () => { active = false; };
  }, [load, attempt]);
  return {data:loading ? null : result.data, loading, error:loading ? '' : result.error, retry:()=>setAttempt(value=>value+1)};
}
