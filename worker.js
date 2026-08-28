const ALLOWED_ORIGIN="https://noburin1.github.io";
const MODEL="@cf/meta/llama-3.2-11b-vision-instruct";

function cors(){
  return {
    "Access-Control-Allow-Origin":ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods":"POST,OPTIONS",
    "Access-Control-Allow-Headers":"Content-Type",
    "Vary":"Origin"
  };
}
function json(data,status=200){
  return new Response(JSON.stringify(data),{
    status,
    headers:{...cors(),"Content-Type":"application/json; charset=utf-8"}
  });
}
function cleanJson(raw){
  if(typeof raw!=="string") return null;
  let s=raw.trim().replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/,"");
  try{return JSON.parse(s)}catch{}
  const m=s.match(/\{[\s\S]*\}/);
  if(m){try{return JSON.parse(m[0])}catch{}}
  return null;
}

export default {
  async fetch(request,env){
    const origin=request.headers.get("Origin")||"";

    if(request.method==="OPTIONS"){
      if(origin!==ALLOWED_ORIGIN)return new Response("Forbidden",{status:403});
      return new Response(null,{headers:cors()});
    }

    if(request.method==="GET"){
      return Response.json({
        ok:true,
        service:"nobu-receipt-v8-free",
        ocr:"Cloudflare Workers AI / Llama 3.2 Vision"
      });
    }

    if(request.method!=="POST")return json({ok:false,error:"POST only"},405);
    if(origin!==ALLOWED_ORIGIN)return json({ok:false,error:"Forbidden origin"},403);

    try{
      if(!env.AI) return json({ok:false,error:"Workers AI binding (AI) is not available"},500);

      const body=await request.json();
      const image=body.image;
      const kind=body.type||"medical";

      if(!image||typeof image!=="string"){
        return json({ok:false,error:"image is required"},400);
      }
      if(image.length>9000000){
        return json({ok:false,error:"image too large"},413);
      }

      const prompt=`画像は日本の「${kind}」書類です。画像の文字を読み取り、次のJSONだけを返してください。
数字を推測で作らず、読めない項目は空文字または0にしてください。
医療費の領収証では「点」を金額にしないでください。「領収額」「患者負担額」「支払額」「合計」などの円金額を優先してください。
令和は西暦へ変換してください。

{
  "date":"YYYY-MM-DD",
  "name":"店舗名・医療機関名・薬局名・支払者名",
  "amount":0,
  "year":"",
  "grossPay":0,
  "withheldTax":0,
  "socialInsurance":0,
  "text":"主要なOCR原文"
}

源泉徴収票でない場合、year/grossPay/withheldTax/socialInsurance は空または0で構いません。`;

      const result=await env.AI.run(MODEL,{
        messages:[
          {role:"system",content:"You are a precise Japanese receipt OCR and document extraction assistant. Return valid JSON only."},
          {role:"user",content:prompt}
        ],
        image:image
      });

      const raw =
        typeof result==="string" ? result :
        result?.response ??
        result?.result ??
        result?.choices?.[0]?.message?.content ??
        "";

      const parsed=cleanJson(raw);

      if(parsed){
        return json({
          ok:true,
          text:String(parsed.text||raw||""),
          fields:{
            date:String(parsed.date||""),
            name:String(parsed.name||""),
            amount:Number(parsed.amount||0),
            year:String(parsed.year||""),
            grossPay:Number(parsed.grossPay||0),
            withheldTax:Number(parsed.withheldTax||0),
            socialInsurance:Number(parsed.socialInsurance||0)
          }
        });
      }

      if(raw){
        return json({ok:true,text:String(raw),fields:{}});
      }

      return json({
        ok:false,
        error:"AI OCR returned no text",
        debugType:typeof result,
        debugKeys:result&&typeof result==="object"?Object.keys(result):[]
      },502);

    }catch(e){
      return json({ok:false,error:String(e?.message||e)},500);
    }
  }
};