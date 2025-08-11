import DefaultLayout from "@/layout/DefaultLayout";

export default function Dashboard() {
    return (
        <DefaultLayout>
        <div className="p-6 fill-inherit">
            <h1 className="text-2xl font-bold mb-4">Dashboard Power BI</h1>
            <div className="w-full h-[80vh] border rounded overflow-hidden shadow">
            <iframe
                title="Dashboard Power BI"
                width="100%"
                height="100%"
                src="https://app.powerbi.com/reportEmbed?reportId=a167be97-d682-4625-bcc9-40ed232292af&autoAuth=true&ctid=68d862a1-ce65-40a8-89a9-a0d59ef05ed6"
                
                allowFullScreen={true}
            ></iframe>
            </div>
        </div>
        </DefaultLayout>
    )
  }
  