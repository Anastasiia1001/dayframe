import type { SlackDigestItem } from '../types';
export const mockSlack:SlackDigestItem[]=[
{id:'s1',group:'Direct mentions',channel:'ui-team',author:'Maya Chen',summary:'Maya would love your eyes on the updated reward flow before the design review.',why:'You were mentioned directly. The review starts at 11:00.',time:'32 min ago'},
{id:'s2',group:'My team',channel:'gamepoint-ui',author:'Sam Rivera',summary:'The team agreed on a lighter motion style for the next release.',why:'This affects the reward reveal animation you are working on.',time:'1 hour ago'},
{id:'s3',group:'My projects',channel:'release-builds',author:'Nina Park',summary:'A new build log may help narrow down the Addressables issue.',why:'Related to GAME-89322, assigned to you.',time:'2 hours ago'},
{id:'s4',group:'Everyone / important',channel:'announcements',author:'People team',summary:'Friday is a focus day. Internal meetings are optional.',why:'A useful heads-up for planning the rest of your week.',time:'3 hours ago'},
{id:'s5',group:'Potentially useful',channel:'design-systems',author:'Elena Brooks',summary:'Updated accessibility guidance includes new contrast examples.',why:'Potentially useful for your next UI review.',time:'4 hours ago'},
{id:'s6',group:'Could help here',channel:'gamepoint-ui',author:'Alex Morgan',summary:'Alex is looking into a UI masking issue similar to one you recently solved.',why:'Your previous investigation could save the team some time.',time:'48 min ago'}];
