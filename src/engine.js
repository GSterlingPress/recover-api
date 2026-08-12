const SAFE_METHODS=new Set(['GET','HEAD','OPTIONS','TRACE']);
const IDEMPOTENT_METHODS=new Set(['GET','HEAD','PUT','DELETE','OPTIONS','TRACE']);
const TRANSIENT_STATUS=new Set([408,425,429,500,502,503,504]);
const AUTH_STATUS=new Set([401,403]);
const REPAIR_STATUS=new Set([400,404,405,406,409,410,411,412,413,414,415,422]);

function n(v,d=null){const x=Number(v);return Number.isFinite(x)?x:d}
function bool(v){return v===true||v==='true'}
function header(headers,name){if(!headers||typeof headers!=='object')return null;for(const [k,v] of Object.entries(headers)){if(k.toLowerCase()===name.toLowerCase())return String(v)}return null}
function retryAfterMs(headers){const raw=header(headers,'retry-after');if(!raw)return null;if(/^\d+$/.test(raw))return Number(raw)*1000;const t=Date.parse(raw);return Number.isFinite(t)?Math.max(0,t-Date.now()):null}
function hasTransientError(error){return /(timeout|timed out|temporar|unavailable|connection reset|econnreset|econnrefused|socket hang up|rate.?limit|too many requests|gateway|overload|try again|network)/i.test(error)}
function hasAuthError(error){return /(unauthori|forbidden|auth|token|credential|permission)/i.test(error)}
function hasRepairError(error){return /(invalid|validation|schema|malformed|missing|required|unsupported|bad request|not found|conflict)/i.test(error)}

export function decide(input={}){
 const method=String(input.method||'GET').toUpperCase();
 const status=n(input.status);
 const error=String(input.error||'');
 const attempt=Math.max(0,n(input.attempt,0));
 const maxAttempts=Math.max(1,n(input.maxAttempts,3));
 const sideEffect=bool(input.sideEffect)||!SAFE_METHODS.has(method);
 const idempotencyKey=bool(input.idempotencyKey);
 const providerRetryable=input.providerRetryable===true?true:input.providerRetryable===false?false:null;
 const retryMs=retryAfterMs(input.headers);
 const methodIdempotent=IDEMPOTENT_METHODS.has(method)||idempotencyKey;
 const uncertainExecution=Boolean(input.uncertainExecution)||/(timeout|timed out|connection reset|socket hang up)/i.test(error);
 const exhausted=attempt>=maxAttempts;

 if(exhausted){return {decision:'ESCALATE',retry:false,risk:'high',reason:`Retry budget exhausted at attempt ${attempt}/${maxAttempts}.`,next:'Escalate with the last error and attempt history.'}}
 if(providerRetryable===false){
   if(status&&REPAIR_STATUS.has(status)||hasRepairError(error))return {decision:'REPAIR_REQUEST',retry:false,risk:'low',reason:'Provider or error semantics indicate retrying unchanged input will not help.',next:'Repair request/auth/state, then submit a new attempt.'};
   return {decision:'ABORT',retry:false,risk:'medium',reason:'Provider explicitly marked this failure non-retryable.',next:'Stop automatic retries and surface the failure.'};
 }
 if((status&&AUTH_STATUS.has(status))||hasAuthError(error))return {decision:'REPAIR_REQUEST',retry:false,risk:'low',reason:'Authentication or authorization failure requires a state/credential change before retry.',next:'Refresh credentials or permissions, then retry as a new attempt.'};
 if(status&&REPAIR_STATUS.has(status)||hasRepairError(error))return {decision:'REPAIR_REQUEST',retry:false,risk:'low',reason:'Request/state error is unlikely to improve with an identical retry.',next:'Change the request or prerequisite state before retrying.'};
 if(sideEffect&&!methodIdempotent&&uncertainExecution){return {decision:'VERIFY_FIRST',retry:false,risk:'high',reason:'A side-effecting non-idempotent action may have completed before the failure became visible.',next:'Verify external state or obtain an idempotency key before retrying.'}}
 if((status===429)||(retryMs!=null)){
   const retryAfter=retryMs??Math.min(60000,1000*Math.pow(2,attempt));
   return {decision:'WAIT',retry:true,retryAfterMs:retryAfter,risk:'low',reason:'Rate-limit/backoff semantics indicate a delayed retry.',next:`Wait about ${retryAfter} ms, then retry.`};
 }
 if(providerRetryable===true||status&&TRANSIENT_STATUS.has(status)||hasTransientError(error)){
   if(sideEffect&&!methodIdempotent)return {decision:'VERIFY_FIRST',retry:false,risk:'high',reason:'Failure looks transient, but repeating a non-idempotent side effect can duplicate the action.',next:'Verify whether the original action committed before retrying.'};
   const retryAfter=Math.min(30000,500*Math.pow(2,attempt));
   return {decision:attempt===0?'RETRY_NOW':'WAIT',retry:true,...(attempt===0?{}:{retryAfterMs:retryAfter}),risk:'low',reason:'Failure is transient and the operation is safe to repeat.',next:attempt===0?'Retry once now.':`Wait about ${retryAfter} ms, then retry.`};
 }
 if(status&&status>=200&&status<300)return {decision:'ABORT',retry:false,risk:'low',reason:'The supplied status is successful; recovery should not run.',next:'Treat the action as successful unless application-level validation says otherwise.'};
 return {decision:'ESCALATE',retry:false,risk:'medium',reason:'Failure does not match a safe deterministic recovery rule.',next:'Escalate or provide richer context before another attempt.'};
}
