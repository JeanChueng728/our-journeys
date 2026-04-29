import type { JourneysState } from './types'

export const SEED_STATE: JourneysState = {
  version: 1,
  ui: {
    activeTripId: 'trip_gx_2024',
    isAdmin: false,
    pinnedTripIds: [],
  },
  trips: [
    {
      id: 'trip_gx_2024',
      name: '广西秘境之旅',
      startDate: '2024-04-05',
      endDate: '2024-04-07',
      days: [
        {
          id: 'day_gx_d1',
          dayNumber: 1,
          title: 'Day 1: 南宁·绿意',
          spots: [
            {
              id: 'spot_qingxiu',
              title: '青秀山',
              dateShot: '2024-04-05',
              tags: ['自然', '山景'],
              description:
                '邕城之韵，绿意盎然。登龙象塔，俯瞰邕江，城市与自然的完美交融。',
              location: {
                name: '南宁 · 青秀山',
                lat: 22.809,
                lng: 108.37,
              },
              media: [
                {
                  id: 'm_qx_1',
                  type: 'photo',
                  src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80',
                  fileName: 'ocean.jpg',
                  createdAt: '2024-04-05T12:00:00.000Z',
                },
                {
                  id: 'm_qx_2',
                  type: 'photo',
                  src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1400&q=80',
                  fileName: 'forest.jpg',
                  createdAt: '2024-04-05T12:05:00.000Z',
                },
                {
                  id: 'm_qx_3',
                  type: 'photo',
                  src: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1400&q=80',
                  fileName: 'hills.jpg',
                  createdAt: '2024-04-05T12:08:00.000Z',
                },
              ],
            },
            {
              id: 'spot_sanjie',
              title: '三街两巷',
              dateShot: '2024-04-05',
              tags: ['街巷', '人文'],
              description: '青石板路，骑楼林立。傍晚时分，光影婆娑，人间烟火气最抚凡人心。',
              location: {
                name: '南宁 · 三街两巷',
                lat: 22.8175,
                lng: 108.322,
              },
              media: [
                {
                  id: 'm_sj_1',
                  type: 'photo',
                  src: 'https://images.unsplash.com/photo-1549693578-d683be217e58?auto=format&fit=crop&w=1400&q=80',
                  fileName: 'street.jpg',
                  createdAt: '2024-04-05T16:10:00.000Z',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
