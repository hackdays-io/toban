import {
  Bytes,
  JSONValueKind,
  dataSource,
  json,
  log,
} from "@graphprotocol/graph-ts";
import { QuestMetadata } from "../generated/schema";

// File Data Source handler. Runs asynchronously once graph-node fetches the
// IPFS object for a CID registered via `QuestMetadataTemplate.create(cid)` in
// questMapping.ts. File handlers cannot read chain-derived entities (Quest);
// they only materialize the off-chain `QuestMetadata` that Quest links to.
export function handleQuestMetadata(content: Bytes): void {
  // The CID the data source was created with — also the id Quest.metadata points at.
  const cid = dataSource.stringParam();
  const metadata = new QuestMetadata(cid);

  const parsed = json.try_fromBytes(content);
  if (parsed.isError) {
    log.warning("questMetadata: failed to parse JSON for CID {}", [cid]);
    metadata.save();
    return;
  }

  const value = parsed.value;
  if (value.kind == JSONValueKind.OBJECT) {
    const obj = value.toObject();

    const title = obj.get("title");
    if (title != null && title.kind == JSONValueKind.STRING) {
      metadata.title = title.toString();
    }

    const description = obj.get("description");
    if (description != null && description.kind == JSONValueKind.STRING) {
      metadata.description = description.toString();
    }
  }

  metadata.save();
}
