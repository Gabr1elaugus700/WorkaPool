import { uuid } from "uuidv4";

export class WorkOrder {
  public readonly id: string;
  public description: string;
  public status: "open" | "in_progress" | "closed";

  constructor(props: Omit<WorkOrder, "id">, id?: string) {
    
    this.description = props.description;
    this.status = props.status;
    this.id = id ?? uuid();
  }
}