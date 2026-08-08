const employeeImages = {
  sudhan: 'https://res.cloudinary.com/dlqbbwdc5/image/upload/v1770361766/sudhan_k5no1a.jpg',
  aslam: 'https://res.cloudinary.com/dlqbbwdc5/image/upload/v1770288946/aslam_tqme8r.webp',
  nurul: 'https://res.cloudinary.com/dlqbbwdc5/image/upload/v1770361765/nurul_fbkhoi.jpg',
  'sah mohammad miyan':
    'https://res.cloudinary.com/dlqbbwdc5/image/upload/v1770288949/shan_xv4zcx.webp',
  'vikash kumar': 'https://res.cloudinary.com/dlqbbwdc5/image/upload/v1770361769/vikas_n4kwta.jpg',
  'rizwan mohammad':
    'https://res.cloudinary.com/dlqbbwdc5/image/upload/v1770361766/rizwan_iipcjq.jpg',
  'subhash cutting master':
    'https://res.cloudinary.com/dlqbbwdc5/image/upload/v1770361767/subhash_tfhx6k.jpg',
  shailendar: 'https://res.cloudinary.com/dlqbbwdc5/image/upload/v1770361766/shailendar_mdmwqq.jpg',
  mukhtar: 'https://res.cloudinary.com/der6k8zbm/image/upload/v1764168202/mukhtar_dqciu4.jpg',
  mahesh: 'https://res.cloudinary.com/dlqbbwdc5/image/upload/v1770288948/mahesh_jr3e2j.webp',
  'naimuddin ansari':
    'https://res.cloudinary.com/der6k8zbm/image/upload/v1764168199/niamuddin_iyhh8r.jpg',
  niamuddin: 'https://res.cloudinary.com/der6k8zbm/image/upload/v1764168199/niamuddin_iyhh8r.jpg',
  ranjeet: 'https://res.cloudinary.com/der6k8zbm/image/upload/v1764168199/niamuddin_iyhh8r.jpg',
  'mobarak miyo':
    'https://res.cloudinary.com/dlqbbwdc5/image/upload/v1770361770/mubarak_kg8i4f.jpg',
  khurshid: 'https://res.cloudinary.com/dlqbbwdc5/image/upload/v1770288947/khurshid_sosa9x.webp',
  nasim: 'https://res.cloudinary.com/dlqbbwdc5/image/upload/v1770448904/nasim_jqrqzx_fq1djl.jpg',
  qamaruddn: 'https://res.cloudinary.com/der6k8zbm/image/upload/v1764168200/qamaruddin_x2htlc.jpg',
  dilshad: 'https://res.cloudinary.com/dlqbbwdc5/image/upload/v1770361764/dilshad_cuyrgt.jpg',
  surendra: 'https://res.cloudinary.com/dlqbbwdc5/image/upload/v1770361767/surendar_teupip.jpg',
  samsul: 'https://res.cloudinary.com/dlqbbwdc5/image/upload/v1770361765/samsul_frnxp0.jpg',
  inamul: 'https://res.cloudinary.com/der6k8zbm/image/upload/v1764168201/inamul_atsm3g.jpg',
  rampreet: 'https://res.cloudinary.com/dlqbbwdc5/image/upload/v1770361770/rampreet_bnyrbx.jpg',
  'idrees miyan':
    'https://res.cloudinary.com/dlqbbwdc5/image/upload/v1770361766/idrish_k0i3zd.jpg',
  pooja: 'https://res.cloudinary.com/dlqbbwdc5/image/upload/v1770288947/pooja_b17nmm.webp',
  'manish kumar':
    'https://res.cloudinary.com/dlqbbwdc5/image/upload/v1770288946/golu_rkbcoi.webp',
};

// Neutral placeholder avatar for employees not yet added to the map above,
// so a new hire never shows a broken image.
const FALLBACK_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23334155'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%2394a3b8'/%3E%3Cpath d='M20 88c0-18 13-30 30-30s30 12 30 30' fill='%2394a3b8'/%3E%3C/svg%3E";

// `rawName` is the employee string as stored, e.g. "Manish Kumar / मनीष कुमार"
export const getEmployeeImage = (rawName) => {
  const key = rawName?.split(' / ')[0]?.trim()?.toLowerCase();
  return (key && employeeImages[key]) || FALLBACK_AVATAR;
};
