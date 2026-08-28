const ALLOWED_ORIGIN="https://noburin1.github.io";
const MODEL="@cf/google/gemma-4-26b-a4b-it";

function cors(){
  return {
    "Access-Control-Allow-Origin":ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods":"POST,OPTIONS",
    "Access-Control-Allow-Headers":"Content-Type",
    "Vary":"Origin"
  };
}
function json(data,status=200){return Response.json(data,{status,headers:cors()})}

export default {
  async fetch(request,env){
    const origin=request.headers.get("Origin")||"";
    if(request.method==="OPTIONS"){
      if(origin!==ALLOWED_ORIGIN)return new Response("Forbidden",{status:403});
      return new Response(null,{headers:cors()});
    }
    if(request.method==="GET"){
      return Response.json({ok:true,service:"nobu-receipt-v7-free",ocr:"Cloudflare Workers AI / Gemma 4"});
    }
    if(request.method!=="POST")return json({ok:false,error:"POST only"},405);
    if(origin!==ALLOWED_ORIGIN)return json({ok:false,error:"Forbidden origin"},403);

    try{
      const body=await request.json();
      const image=body.image;
      const kind=body.type||"medical";
      if(!image||typeof image!=="string")return json({ok:false,error:"image is required"},400);
      if(image.length>9000000)return json({ok:false,error:"image too large"},413);

      const prompt=`この画像は日本のレシート、医療費領収証、または源泉徴収票です。
画像を正しい向きとして読み、日本語OCRを行ってください。推測で数字を作らないでください。
特に「点数」と「実際の支払金額（円）」を混同しないでください。
種別は ${kind} です。

次の情報を読み取ってください:
- date: 日付。令和なら西暦YYYY-MM-DDへ変換
- name: 店舗名、医療機関名、薬局名、または支払者名
- amount: 実際に支払った金額（円）。医療領収証では点数ではなく領収額・患者負担額・支払額
- year: 源泉徴収票の年（西暦）
- grossPay: 支払金額
- withheldTax: 源泉徴収税額
- socialInsurance: 社会保険料等の金額
- text: 画像から読める主要な原文

JSONだけを返してください。形式:
{"date":"","name":"","amount":0,"year":"","grossPay":0,"withheldTax":0,"socialInsurance":0,"text":""}`;

      const ai=await env.AI.run(MODEL,{
        messages:[
          {role:"system",content:"You are a precise Japanese document OCR and structured-data extractor. Return JSON only."},
          {role:"user",content:prompt}
        ],
        image:image,
        temperature:0,
        max_tokens:1200
      });

      let raw=ai?.choices?.[0]?.message?.content ?? ai?.response ?? ai?.result ?? "";
      if(typeof raw!=="string")raw=JSON.stringify(raw);
      let cleaned=raw.trim().replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/,"");
      let parsed=null;
      try{parsed=JSON.parse(cleaned)}catch{
        const m=cleaned.match(/\{[\s\S]*\}/);
        if(m)try{parsed=JSON.parse(m[0])}catch{}
      }
      if(!parsed)return json({ok:true,text:raw,fields:{}});
      return json({ok:true,text:parsed.text||raw,fields:parsed});
    }catch(e){
      return json({ok:false,error:String(e?.message||e)},500);
    }
  }
};