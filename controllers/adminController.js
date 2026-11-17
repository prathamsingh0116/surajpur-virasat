const Sanctuary = require("../models/Sanctuary");
const Wildlife = require("../models/Wildlife");
const Flora = require("../models/Flora");
const Gallery = require("../models/Gallery");
const Checkpoint = require("../models/Checkpoint");
const EmergencyContact = require("../models/EmergencyContact");

exports.dashboard = async (req, res) => {
  const [wildlife, flora, gallery, checkpoints, contacts, sanctuary] = await Promise.all([
    Wildlife.countDocuments(), Flora.countDocuments(), Gallery.countDocuments(),
    Checkpoint.countDocuments(), EmergencyContact.countDocuments(), Sanctuary.findOne({slug:"main"}).lean()
  ]);
  res.render("admin/dashboard", { title:"Admin Dashboard", counts:{wildlife,flora,gallery,checkpoints,contacts}, sanctuary });
};

exports.content = async (req,res) => {
  const type = req.params.type;
  const map = { wildlife:Wildlife, flora:Flora, gallery:Gallery, checkpoints:Checkpoint, contacts:EmergencyContact };
  const Model = map[type];
  if (!Model) return res.status(404).render("error",{title:"Not found",message:"Unknown content type."});
  const items = await Model.find().sort({sortOrder:1,createdAt:-1}).lean();
  res.render("admin/content",{title:`Manage ${type}`,type,items});
};

exports.newForm = async (req,res) => {
  if (!getModel(req.params.type)) return res.status(404).render("error",{title:"Not found",message:"Unknown content type."});
  const checkpoints = req.params.type === "gallery" ? await Checkpoint.find({active:true}).sort({sortOrder:1}).lean() : [];
  res.render("admin/edit",{title:`Add ${req.params.type}`,type:req.params.type,item:{},checkpoints});
};
exports.editForm = async (req,res) => {
  const Model = getModel(req.params.type);
  if (!Model) return res.redirect("/admin");
  const item = await Model.findById(req.params.id).lean();
  if (!item) { req.flash("error","Content item not found."); return res.redirect(`/admin/${req.params.type}`); }
  const checkpoints = req.params.type === "gallery" ? await Checkpoint.find({active:true}).sort({sortOrder:1}).lean() : [];
  res.render("admin/edit",{title:`Edit ${req.params.type}`,type:req.params.type,item,checkpoints});
};

exports.save = async (req,res) => {
  const Model = getModel(req.params.type);
  if (!Model) return res.redirect("/admin");
  const payload = buildPayload(req.params.type, req.body);
  if (req.params.type === "checkpoints") {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.slug)) {
      req.flash("error","Use a URL slug with lowercase letters, numbers and hyphens only.");
      return res.redirect(req.params.id ? `/admin/checkpoints/${req.params.id}/edit` : "/admin/checkpoints/new");
    }
    if (req.params.id) {
      const existingCheckpoint = await Checkpoint.findById(req.params.id).lean();
      if (existingCheckpoint && existingCheckpoint.slug !== payload.slug) {
        req.flash("error","A location slug is permanent because printed QR stickers use it. Create a new location instead of changing this slug.");
        return res.redirect(`/admin/checkpoints/${req.params.id}/edit`);
      }
    }
    const duplicate = await Checkpoint.findOne({ slug: payload.slug, ...(req.params.id ? { _id: { $ne: req.params.id } } : {}) }).lean();
    if (duplicate) {
      req.flash("error","This location slug is already in use. Keep existing QR slugs unchanged.");
      return res.redirect(req.params.id ? `/admin/checkpoints/${req.params.id}/edit` : "/admin/checkpoints/new");
    }
  }
  if (req.params.type === "gallery" && payload.checkpointSlug !== "main") {
    const locationExists = await Checkpoint.exists({ slug: payload.checkpointSlug });
    if (!locationExists) {
      req.flash("error","Choose an existing location for this gallery photo.");
      return res.redirect(req.params.id ? `/admin/gallery/${req.params.id}/edit` : "/admin/gallery/new");
    }
  }
  if (req.params.id) await Model.findByIdAndUpdate(req.params.id,payload,{runValidators:true});
  else await Model.create(payload);
  req.flash("success","Content saved successfully.");
  res.redirect(`/admin/${req.params.type}`);
};

exports.remove = async (req,res) => {
  const Model = getModel(req.params.type);
  if (!Model) return res.redirect("/admin");
  if (req.params.type === "checkpoints") {
    req.flash("error","QR locations cannot be permanently deleted because printed stickers may still point to them. Uncheck Active to remove a location from the public Explore menu while keeping its QR link working.");
    return res.redirect("/admin/checkpoints");
  }
  await Model.findByIdAndDelete(req.params.id);
  req.flash("success","Content deleted.");
  res.redirect(`/admin/${req.params.type}`);
};

exports.sanctuaryForm = async (req,res) => {
  const sanctuary = await Sanctuary.findOne({slug:"main"}).lean();
  res.render("admin/sanctuary",{title:"Sanctuary information",sanctuary});
};

exports.updateSanctuary = async (req,res) => {
  const b=req.body;
  await Sanctuary.findOneAndUpdate({slug:"main"},{
    name:{en:b.nameEn,hi:b.nameHi},
    tagline:{en:b.taglineEn,hi:b.taglineHi},
    district:{en:b.districtEn,hi:b.districtHi},
    area:b.area, established:b.established, coordinates:b.coordinates,
    mapUrl:b.mapUrl, mapEmbedUrl:b.mapEmbedUrl, heroImage:b.heroImage,
    factsVerified:b.factsVerified === "on"
  },{upsert:true,new:true});
  req.flash("success","Sanctuary information updated.");
  res.redirect("/admin/sanctuary");
};

function getModel(type) {
  return ({wildlife:Wildlife,flora:Flora,gallery:Gallery,checkpoints:Checkpoint,contacts:EmergencyContact})[type];
}
function localized(body, prefix) { return {en:body[`${prefix}En`] || "",hi:body[`${prefix}Hi`] || ""}; }
function buildPayload(type,b) {
  const sortOrder=Number(b.sortOrder || 0);
  if(type==="wildlife" || type==="flora") return {
    name:localized(b,"name"), scientificName:b.scientificName, description:localized(b,"description"),
    category:b.category || "mammal", image:b.image, active:b.active==="on", sortOrder,
    contentVerified:b.contentVerified==="on"
  };
  if(type==="gallery") return {
    image:b.image, checkpointSlug:String(b.checkpointSlug || "main").trim().toLowerCase(), caption:localized(b,"caption"), alt:localized(b,"alt"),
    credit:b.credit || "", license:b.license || "", sourceUrl:b.sourceUrl || "", isLocalPhoto:b.isLocalPhoto==="on",
    active:b.active==="on",sortOrder,photoVerified:b.photoVerified==="on"
  };
  if(type==="checkpoints") return {
    slug:String(b.slug||"").trim().toLowerCase(),name:localized(b,"name"),description:localized(b,"description"),
    overview:localized(b,"overview"),visitorTips:localized(b,"visitorTips"),
    history:localized(b,"history"),storyTitle:localized(b,"storyTitle"),story:localized(b,"story"),
    railway:{
      stationName:b.railwayStationName || "Surajpur Road Railway Station",
      stationCode:b.railwayStationCode || "SJPR",
      distanceKm:b.railwayDistanceKm === "" ? null : Number(b.railwayDistanceKm),
      villageReferenceKm:b.railwayVillageReferenceKm === "" ? null : Number(b.railwayVillageReferenceKm),
      distanceBasis:b.railwayDistanceBasis || "",
      note:localized(b,"railwayNote")
    },
    destination:b.destination || "",
    coordinates:{lat:b.latitude === "" ? null : Number(b.latitude),lng:b.longitude === "" ? null : Number(b.longitude)},
    sources:String(b.sourcesText || "").split(/\r?\n/).map(line=>line.trim()).filter(Boolean).map(line=>{
      const [title,...urlParts]=line.split("|");
      return {title:title.trim(),url:urlParts.join("|").trim()};
    }).filter(source=>source.title && /^https?:\/\//i.test(source.url)),
    heroImage:b.heroImage || "",mapUrl:b.mapUrl || "",mapEmbedUrl:b.mapEmbedUrl || "",
    icon:b.icon||"map-pin",active:b.active==="on",sortOrder,contentVerified:b.contentVerified==="on"
  };
  return {
    label:localized(b,"label"),phone:b.phone,description:localized(b,"description"),
    active:b.active==="on",verified:b.verified==="on",sortOrder
  };
}
