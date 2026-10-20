import { bereavementRelationList } from "../data/mockData";
import type { BereavementRelation } from "../types/domain";
import { TABLES, readTable } from "./db";

export function findAll(): BereavementRelation[] {
  return readTable(TABLES.bereavementRelationList, bereavementRelationList);
}
