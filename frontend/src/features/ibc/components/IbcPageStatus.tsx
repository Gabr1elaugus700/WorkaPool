import DefaultLayout from "@/layout/DefaultLayout";
import IbcStatusContent, { type IbcStatusContentProps } from "./IbcStatusContent";

export type IbcPageStatusProps = IbcStatusContentProps;

export default function IbcPageStatus(props: IbcPageStatusProps) {
  return (
    <DefaultLayout>
      <div className="w-full px-2 sm:px-4">
        <IbcStatusContent {...props} />
      </div>
    </DefaultLayout>
  );
}
