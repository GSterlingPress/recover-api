import crypto from 'node:crypto';

export const VERIFICATION_CLASSES=['CONTROLLED_TEST','KNOWN_VALIDATOR','LIKELY_VALIDATOR','UNKNOWN_MACHINE','CREDIBLE_REAL_USE'];
export const VERIFICATION_POLICY_VERSION=1;

const DEFAULT_VALIDATOR_RE=/(smithery|glama|pulsemcp|pulse-mcp|mcp[- ]?registry|registry\.modelcontextprotocol|modelcontextprotocol.*registry|verifymcp|mcp-verifier|healthcheck)/i;
const DEFAULT_INTERACTIVE_RE=/(claude|cursor|windsurf|vscode|visual studio code|chatgpt|openai|cline|roo|zed)/i;

function safe(v,max=512){const s=String(v||'').trim();return s?s.slice(0,max):null}
function hash(v){return crypto.createHash('sha256').update(String(v||'unknown')).digest('hex').slice(0,12)}

export function callerFingerprint(req){
 const ip=String(req.headers['x-forwarded-for']||'').split(',')[0].trim()||req.socket?.remoteAddress||'';
 return hash([ip,req.headers['user-agent']||'',req.headers['accept-language']||''].join('|'));
}

export function isControlledRequest(req,{serviceInternalHeader}={}){
 const serviceFlag=serviceInternalHeader?String(req.headers[serviceInternalHeader]||'')==='1':false;
 const genericFlag=String(req.headers['x-tollbooth-internal']||'')==='1';
 const ua=String(req.headers['user-agent']||'');
 return genericFlag||serviceFlag||/(github-actions|controlled[- ]?(test|smoke)|healthcheck)/i.test(ua);
}

export function auditEnvelope(req,{clientInfo=null,path=null}={}){
 return {
  userAgent:safe(req.headers['user-agent'],512),
  acceptLanguage:safe(req.headers['accept-language'],128),
  origin:safe(req.headers.origin,256),
  referrer:safe(req.headers.referer||req.headers.referrer,256),
  via:safe(req.headers.via,128),
  forwardedHost:safe(req.headers['x-forwarded-host'],128),
  requestMethod:safe(req.method,16),
  requestPath:safe(path??req.url,128),
  clientInfo:clientInfo?.name?{name:safe(clientInfo.name,80),version:safe(clientInfo.version,40)}:null
 };
}

export function classifyCandidate(event,{
 isCoreUse,
 isDemo=()=>false,
 discoveryAt=null,
 validatorRe=DEFAULT_VALIDATOR_RE,
 interactiveClientRe=DEFAULT_INTERACTIVE_RE,
 credibleEvidence=()=>false
}={}){
 if(!event.external)return {classification:'CONTROLLED_TEST',reasons:['internal/test marker']};
 if(!isCoreUse?.(event))return {classification:null,reasons:[]};
 if(isDemo(event))return {classification:'CONTROLLED_TEST',reasons:['demo/trial/test path']};
 const text=[event.audit?.userAgent,event.audit?.clientInfo?.name,event.audit?.clientInfo?.version,event.audit?.origin,event.audit?.referrer,event.audit?.via,event.source,event.discoveryAttribution].filter(Boolean).join(' ');
 if(validatorRe.test(text))return {classification:'KNOWN_VALIDATOR',reasons:['known registry/directory/validator evidence']};
 const delay=discoveryAt==null?null:Math.max(0,new Date(event.at).getTime()-discoveryAt);
 if(credibleEvidence(event,{delay,interactiveClientRe}))return {classification:'CREDIBLE_REAL_USE',reasons:['independent real-use evidence',...(delay==null?[]:[`discovery-to-core ${delay}ms`])]};
 if(delay!=null&&delay<=15000)return {classification:'LIKELY_VALIDATOR',reasons:[`discovery-to-core only ${delay}ms`,'no stronger independent-use evidence']};
 return {classification:'UNKNOWN_MACHINE',reasons:['core operation observed','insufficient evidence to prove genuine stranger']};
}

export function verifiedMilestones(events,count=10){
 const seen=new Set();const out=[];
 for(const e of events){if(e.classification!=='CREDIBLE_REAL_USE'||seen.has(e.caller))continue;seen.add(e.caller);out.push({number:out.length+1,achieved:true,...e});if(out.length===count)break}
 while(out.length<count)out.push({number:out.length+1,achieved:false});
 return out;
}

export const privacyContract={rawIpStored:false,requestPayloadStored:false,credentialsStored:false,fullSensitiveTargetUrlStored:false};
