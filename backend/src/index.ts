const SERVICE_URL = 'http://serverpool3:80/g5-senior-services/sapiens_Synccom_senior_g5_co_cad_representante?wsdl';

async function fetchData() {
    const resp = await fetch(SERVICE_URL);
    console.log(resp);
}