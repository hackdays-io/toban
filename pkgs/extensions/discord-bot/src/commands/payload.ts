/**
 * The bot's slash-command definitions — the single source of truth.
 *
 * Two places register commands with Discord, and they must send the *same*
 * payload:
 *
 *   - `scripts/register-commands.ts` — manual CLI, for guilds that were
 *     invited with a plain OAuth URL.
 *   - `src/api/install/callback.ts` — the frontend-initiated install flow,
 *     which registers automatically right after binding the guild.
 *
 * They used to hold two hand-maintained copies, which silently drifted: the
 * install-flow copy was missing `/thx address` and the `amount` minimum, so
 * guilds onboarded through the frontend got a command that `commands/thx.ts`
 * could handle but nobody could invoke. Both now import this module, so a new
 * option can only be added in one place.
 *
 * Registration is `PUT .../commands`, i.e. a full replacement — whatever is
 * here becomes the guild's entire command list.
 *
 * Option `type` values (Discord application command option types):
 *   1 = SUB_COMMAND, 3 = STRING, 4 = INTEGER, 6 = USER
 */

/** Command `type` 1 = CHAT_INPUT (slash command). */
export const COMMANDS_PAYLOAD = [
  {
    name: "toban-setup",
    description: "Issue a link to connect your wallet to your Discord account",
    type: 1,
  },
  {
    name: "toban-link",
    description: "(admin) Link this server to a Toban workspace",
    type: 1,
    options: [
      {
        name: "workspace_url",
        description: "Toban workspace URL (e.g. https://toban.xyz/3002)",
        type: 3,
        required: true,
      },
    ],
  },
  {
    name: "balance",
    description: "Show your mintAllowance and mintable budget",
    type: 1,
  },
  {
    name: "thx",
    description: "Send THX to another member",
    type: 1,
    options: [
      // Discord requires `required: true` options to come before optional
      // ones, so amount sits at the top.
      {
        name: "amount",
        description: "Amount of THX (positive integer)",
        type: 4,
        required: true,
        min_value: 1,
      },
      {
        name: "user",
        description: "Recipient (pick from this server)",
        type: 6,
        required: true,
      },
      {
        name: "address",
        description:
          "Override: send to this 0x address or ENS name instead of the user's linked wallet.",
        type: 3,
        required: false,
      },
      {
        name: "message",
        description: "Optional thank-you note",
        type: 3,
        required: false,
      },
    ],
  },
  {
    name: "quest",
    description: "Quest actions",
    type: 1,
    options: [
      {
        name: "submit",
        description: "Submit completion of a quest you can work on",
        type: 1, // SUB_COMMAND
        options: [
          {
            name: "quest",
            description: "Pick a quest to submit",
            type: 3, // STRING
            required: true,
            autocomplete: true,
          },
        ],
      },
    ],
  },
] as const;
