import _ from 'lodash';

export function prepareDbObject (o)  {
  if (o && o._id && typeof(o._id) === 'number') {
    o._id = o._id.toString();
  }
  return o;
}

export async function updateTags(oldTags, newTags, pageId, db) {

  oldTags = oldTags || [];
  newTags = newTags || [];

  const Tags = db.collection('tags');
  const commonTags = _.intersection(oldTags, newTags);

  oldTags = _.difference(oldTags, commonTags);
  newTags = _.difference(newTags, commonTags);
  const allTags = _.union(oldTags, newTags);

  let tags = await Tags.find({ text: { $in: allTags } });

  _.each(oldTags, (oldTag) => {
    const tag =_.find(tags, { text: oldTag});
    if (tag) {
      tag.pagesIds = _.without(tag.pagesIds, pageId);
    }
  });

  _.each(newTags, (newTag) => {
    const tag =_.find(tags, { text: newTag});
    if (tag) {
      tag.pagesIds.push(pageId);
    } else {
      tags.push({
        text: newTag,
        pagesIds: [pageId]
      });
    }
  });

  _.each(tags, (tag) => {
    if (tag._id) {
      Tags.update({text: tag.text}, {
        $set: tag
      });
    } else {
      Tags.insert(tag)
    }
  });
}

export async function initPageTags(db) {
  const Pages = db.collection('pages');
  const Tags = db.collection('tags');

  const tagsData = {};
  const tags = [];
  const pages = await Pages.find({
    tags: { $exists: true }
  }).toArray();

  await Tags.remove();

  for (let i = 0; i < pages.length; i++) {
    const page = prepareDbObject(pages[i]);
    for (let j = 0; j < page.tags.length; j++) {
      let tag = page.tags[j];
      if (tagsData[tag]) {
        tagsData[tag].push(page._id.toString());
      } else {
        tagsData[tag] = [page._id.toString()];
      }
    }
  }

  Object.keys(tagsData).map(function(key, index) {
    tags.push({
      text: key,
      pagesIds: tagsData[key]
    })
  });
  if (tags.length) {
    await Tags.insert(tags);
  }
}