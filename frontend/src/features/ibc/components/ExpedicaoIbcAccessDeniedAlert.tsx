import DefaultLayout from "@/layout/DefaultLayout";
import IbcAccessDeniedAlert from "./IbcAccessDeniedAlert";
import { IBC_EXPEDICAO_ROLES } from "../utils/canAccessExpedicaoIbc";

type Props = {
  targetPhrase?: string;
  requiredRoles?: readonly string[];
};

export default function ExpedicaoIbcAccessDeniedAlert({
  targetPhrase = "a Expedição IBC",
  requiredRoles = IBC_EXPEDICAO_ROLES,
}: Props) {
  return (
    <DefaultLayout>
      <IbcAccessDeniedAlert requiredRoles={requiredRoles} targetPhrase={targetPhrase} />
    </DefaultLayout>
  );
}
