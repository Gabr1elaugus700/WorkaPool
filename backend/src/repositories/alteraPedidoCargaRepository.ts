import { sqlPool, sqlPoolConnect } from "../database/sqlServer";

export async function UpdatePedidoCarga(codCar: number, posCar: number, numPed: number) {
    await sqlPoolConnect;

    const result = await sqlPool.request()
        .input('codCar', codCar)
        .input('posCar', posCar)
        .input('numPed', numPed)
        .query(`
            UPDATE e120ped 
            SET usu_codcar=@codCar 
               ,usu_poscar =@posCar
            WHERE numped = @numPed
        `);
    return result.rowsAffected[0];
}