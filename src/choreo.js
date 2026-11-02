/* Choreography: turns a track's list of roles (content/story.json → actions) into moves for the figure.
   Roles play in order and the last one repeats. The director handles the in-between steps itself:
   standing up before a standing role, sitting down before a seated one, and walking between marks.
   Roles map to clips through content/profile.json → character.clips (missing clips fall back to idle). */

// Roles performed sitting down; everything else is performed standing.
const SEATED = new Set(["sitDown", "sitIdle", "sitTalk", "type", "sitClap"]);
// Two marks on stage: each walk goes to the other one, so the figure never leaves the stage or its frame.
const MARKS = [-0.55, 0.55];
const QUICK = 1.6; // sitting down and standing up play faster than Mixamo's originals

export function createDirector(fig, { onRole } = {}) {
  let run = 0, restRole = "idle", groove = false, mark = 0;
  const live = (id) => id === run;

  const once = (role, speed) => fig.play(fig.clipFor(role), { once: true, speed });
  function rest(role) {
    restRole = role;
    fig.setRest(fig.clipFor(groove && role === "idle" ? "nod" : role));
  }

  async function sitDown() {
    fig.setProp("chair", true);
    fig.posture = "seated";
    await once("sitDown", QUICK);
    rest("sitIdle");
  }
  async function standUp() {
    fig.setProp("desk", false);
    fig.posture = "standing";
    await once("standUp", QUICK);
    fig.setProp("chair", false);
    rest("idle");
  }
  function walkIn() {
    mark = 1 - mark;
    return fig.walk({ x: MARKS[mark], z: 0 }, { seconds: 1.4 });
  }
  // Walk upstage with the back turned, then come down the runway
  async function catwalk(id) {
    await fig.walk({ x: 0, z: -3.5 }, { seconds: 1.3 });
    if (!live(id)) return;
    const clip = fig.clipFor("catwalk") === "idle" ? "walk" : fig.clipFor("catwalk");
    await fig.walk({ x: 0, z: 0 }, { seconds: 2.4, clip });
  }

  async function perform(role, id, last) {
    const seated = SEATED.has(role);
    if (fig.posture === "seated" && !seated) await standUp();
    else if (fig.posture !== "seated" && seated && role !== "sitDown") await sitDown();
    if (!live(id)) return;
    fig.setProp("desk", role === "type");
    onRole?.(role);
    if (role === "walkIn") return walkIn();
    if (role === "catwalk") return catwalk(id);
    if (role === "sitDown") return fig.posture === "seated" ? undefined : sitDown();
    if (role === "standUp") return;
    if (last) return rest(role);
    return once(role);
  }

  return {
    // Play a list of roles in order; a newer call cancels the one before.
    async perform(roles = ["idle"]) {
      const id = ++run;
      await fig.ready;
      for (let i = 0; i < roles.length && live(id); i++) {
        await fig.whenFree(); // let a click's wave finish first
        if (!live(id)) return;
        await perform(roles[i], id, i === roles.length - 1);
      }
    },
    // While the album plays, the resting idle becomes a nod to the beat.
    setGroove(on) {
      groove = on;
      if (restRole === "idle") rest("idle");
    },
  };
}
