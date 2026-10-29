# Story map: choreography for the figure

Each track plays as the visitor scrolls: **Enter** (moving from the last scene), the **Beat** (the moment the track is
about), **Rest** (a loop while the text is read), and a **Click** reaction for visitors who poke the figure.
Motions marked **NEW** need downloading from Mixamo; the rest are already in `public/models/bhavay.glb`.

## Landing (album cover)
| Enter | Beat | Rest | Click |
| --- | --- | --- | --- |
| Idle | Waving (once, on arrival) | Idle | Waving |

## Track 0: Press Play
Dark stage, a glowing play button. Pressing it starts the music.
| Enter | Beat | Rest | Click |
| --- | --- | --- | --- |
| Idle, head down in the dark | **NEW Head nod to the beat** as the music starts, then Waving ("Hey there!") | NEW Head nod (loop, music on) / Idle (music off) | Waving |

## Track 1: The Quiet Kid in the Corner
Cosy corner, headphones on, then the Python moment.
| Enter | Beat | Rest | Click |
| --- | --- | --- | --- |
| Walking into the corner → Sitting (sit down) | Sitting Idle (daydreaming) → **NEW Typing** when Python arrives | NEW Typing | **NEW Sitting Clap** (excited) |

## Track 2: The Brag Board
Corkboard; pins pop on drum hits.
| Enter | Beat | Rest | Click |
| --- | --- | --- | --- |
| **NEW Stand Up** → Walking to the board | Pointing at each pin as it lands → **NEW Victory** on "World Champion" | Idle | NEW Victory |

## Track 3: The Plot Twist
Record scratch, the road curves, headphones swap for a headset.
| Enter | Beat | Rest | Click |
| --- | --- | --- | --- |
| **NEW Surprised** (record scratch) → **NEW Looking Around** | Walking along the curve → Sitting → Sitting Talking (support calls) | Sitting Talking → Sitting Idle (shift over, headphones back) | NEW Surprised |

## Track 4: Back to the Future of AI
A portal into a lab of robots and data streams.
| Enter | Beat | Rest | Click |
| --- | --- | --- | --- |
| NEW Stand Up → Start Walking through the portal | NEW Looking Around (awe) → Kneeling Pointing at the data → **NEW Thinking** at the dashboards | Idle | NEW Thinking |

## Track 5: Leading the Runway
Runway lights; outfits strut past; clipboard and coffee.
| Enter | Beat | Rest | Click |
| --- | --- | --- | --- |
| **NEW Catwalk walk** down the runway | Stops, NEW Head nod to the groove → **NEW Talking** (directing the team) → Pointing | NEW Head nod | Pointing |

## Track 6: To Be Continued…
Crossroads with glowing paths; "THE END" shuffles into "TO BE CONTINUED".
| Enter | Beat | Rest | Click |
| --- | --- | --- | --- |
| Walking to the crossroads | NEW Looking Around → **NEW Shrugging** ("where next?") → Waving (wink and wave) | Idle | **NEW Bow** |

## Hidden extra
Clicking the vinyl (or the figure five times) plays a short **NEW dance**: a playful reward for curious visitors.

## Motion list

### Already in the model (9)
Idle · Waving · Walking (in place) · Start Walking · Pointing · Kneeling Pointing · Sitting (sit down) ·
Sitting Idle · Sitting Talking

### To download: must have (6)
The story's beats depend on these.
| Role | Mixamo search | Used in |
| --- | --- | --- |
| nod | "head nod", "bobbing", or a gentle groove/listening move | Tracks 0, 5; the music theme |
| standUp | "stand up" / "sitting to standing" | Tracks 2, 4 (no jump-cut from sitting) |
| type | "typing" (seated) | Track 1 |
| lookAround | "looking around" | Tracks 3, 4, 6 |
| victory | "victory" or "cheering" | Track 2 |
| surprised | "surprised" | Track 3 |

### To download: nice to have (7)
| Role | Mixamo search | Used in |
| --- | --- | --- |
| catwalk | "catwalk" walk (tick In Place) | Track 5 (Walking works without it) |
| talk | "talking" / "explaining" (standing) | Track 5 |
| think | "thinking" | Track 4 |
| shrug | "shrugging" | Track 6 |
| sitClap | "sitting clap" | Track 1 click |
| bow | "bow" | Track 6 click |
| dance | any short fun dance | Hidden extra |

## Mixamo download settings
- Format **FBX Binary**, Skin **Without Skin** (Idle With Skin is already in `models/source/mixamo/`), **30 fps**,
  Keyframe reduction **none**.
- Tick **In Place** on anything that walks (the site moves the figure itself).
- **Character Arm-Space:** raise it to about 55–65 on clips where the arms come up (Victory, Talking, Shrugging,
  Thinking, dance). This keeps the arms further from the body and reduces the hoodie pull at the armpit.
  Re-downloading Waving and Pointing with the same setting would help them too. Use the same value on every clip.
- Keep Mixamo's file names and save them to `models/source/mixamo/`. I map them to roles when merging.
