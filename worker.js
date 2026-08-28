const ALLOWED_ORIGIN="https://noburin1.github.io";

function cors(){
  return {
    "Access-Control-Allow-Origin":ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods":"POST,OPTIONS",
    "Access-Control-Allow-Headers":"Content-Type",
    "Vary":"Origin"
  };
}

export default {
  async fetch(request,env){
    const origin=request.headers.get("Origin")||"";

    if(request.method==="OPTIONS"){
      if(origin!==ALLOWED_ORIGIN)return new Response("Forbidden",{status:403});
      return new Response(null,{headers:cors()});
    }

    if(request.method==="GET"){
      return Response.json({ok:true,service:"nobu-receipt-ocr-v6"});
    }

    if(request.method!=="POST"){
      return Response.json({ok:false,error:"POST only"},{status:405,headers:cors()});
    }

    if(origin!==ALLOWED_ORIGIN){
      return Response.json({ok:false,error:"Forbidden origin"},{status:403,headers:cors()});
    }

    try{
      const {image}=await request.json();
      if(!image||typeof image!=="string"){
        return Response.json({ok:false,error:"image is required"},{status:400,headers:cors()});
      }

      const base64=image.includes(",")?image.split(",")[1]:image;
      if(base64.length>12000000){
        return Response.json({ok:false,error:"image too large"},{status:413,headers:cors()});
      }

      const r=await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(env.GOOGLE_VISION_API_KEY)}`,
        {
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({
            requests:[{
              image:{content:base64},
              features:[{type:"DOCUMENT_TEXT_DETECTION"}],
              imageContext:{languageHints:["ja"]}
            }]
          })
        }
      );

      const data=await r.json();
      if(!r.ok||data.responses?.[0]?.error){
        const msg=data.responses?.[0]?.error?.message||data.error?.message||`Vision HTTP ${r.status}`;
        return Response.json({ok:false,error:msg},{status:502,headers:cors()});
      }

      const text=data.responses?.[0]?.fullTextAnnotation?.text
        ||data.responses?.[0]?.textAnnotations?.[0]?.description
        ||"";

      return Response.json({ok:true,text},{headers:cors()});
    }catch(e){
      return Response.json({ok:false,error:String(e?.message||e)},{status:500,headers:cors()});
    }
  }
};