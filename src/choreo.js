/* Choreography: turns a track's list of roles (content/story.json → actions) into moves for the figure.
   Roles play in order and the last one repeats. The director handles the in-between steps itself:
   standing up before a standing role, sitting down before a seated one, and walking on and off stage.
   Roles map to clips through content/profile.json → character.clips (missing clips fall back to idle). */

// Roles performed sitting down; everything else is performed standing.
const SEATED = new Set(["sitDown", "sitIdle", "sitTalk", "type", "sitClap"]);
const OFFSTAGE = 3; // x (or depth) just outside the stage

export function createDirector(fig) {
  let run = 0, restRole = "idle", groove = false;
  const live = (id) => id === run;

  const once = (role) => fig.play(fig.clipFor(role), { once: true });
  function rest(role) {
    restRole = role;
    fig.setRest(fig.clipFor(groove && role === "idle" ? "nod" : role));
  }

  async function sitDown() {
    fig.setProp("chair", true);
    fig.posture = "seated";
    await once("sitDown");
    rest("sitIdle");
  }
  async function standUp() {
    fig.setProp("desk", false);
    fig.posture = "standing";
    await once("standUp");
    fig.setProp("chair", false);
    rest("idle");
  }
  // Walk off to the right, then in from the left: the scene changes while the stage is empty.
  async function walkIn(id) {
    if (Math.abs(fig.position.x) < OFFSTAGE - 0.1) await fig.walk({ x: OFFSTAGE, z: 0 }, { seconds: 1.3 });
    if (!live(id)) return;
    fig.place(-OFFSTAGE, 0);
    await fig.walk({ x: 0, z: 0 }, { seconds: 1.8 });
  }
  async function catwalk(id) {
    if (Math.abs(fig.position.x) < OFFSTAGE - 0.1) await fig.walk({ x: OFFSTAGE, z: 0 }, { seconds: 1.3 });
    if (!live(id)) return;
    fig.place(0, -9);
    await fig.walk({ x: 0, z: 0 }, { seconds: 3.4, clip: fig.clipFor("catwalk") === "idle" ? "walk" : fig.clipFor("catwalk") });
  }

  async function perform(role, id, last) {
    const seated = SEATED.has(role);
    if (fig.posture === "seated" && !seated) await standUp();
    else if (fig.posture !== "seated" && seated && role !== "sitDown") await sitDown();
    if (!live(id)) return;
    fig.setProp("desk", role === "type");
    if (role === "walkIn") return walkIn(id);
    if (role === "catwalk") return catwalk(id);
    if (role === "sitDown") return fig.posture === "seated" ? undefined : sitDown();
    if (role === "standUp") return;
    if (last) return rest(role);
    return once(role);
  }

  return {
    // Play a track's roles in order; a newer call cancels the one before.
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
    once,
  };
}
