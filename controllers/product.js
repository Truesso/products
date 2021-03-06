const pool = require('../db/db');

exports.getRelated = async (req, res) => {
  try {
    const productId = req.params.product_id;

    pool.query(`
    SELECT related_product_id
    FROM related
    WHERE current_product_id = $1;`, [productId])
      .then((results) => {
        const returnData = results.rows.map((row) => row.related_product_id);
        res.send(returnData);
      });
  } catch (err) {
    res.status(404).send(err.message);
  }
};

exports.getStyles = async (req, res) => {
  try {
    const productId = req.params.product_id;

    const styles = pool.query(`
    SELECT *
    FROM styles
    WHERE product_id = $1;`, [productId]);

    const queryPhotos = async (styleID) => {
      const photos = await pool.query(`
      SELECT url, thumbnail_url
      FROM photos
      WHERE style_id =  $1;`, [styleID]);
      return photos.rows;
    };

    const querySkus = async (styleID) => {
      const skusResults = await pool.query(`
      SELECT *
      FROM skus
      WHERE style_id = $1;`, [styleID]);

      const skus = {};
      skusResults.rows.forEach((row) => {
        skus[row.id] = {
          quantity: row.quantity,
          size: row.size,
        };
      });

      return skus;
    };

    const getStyleData = async (style) => {
      const otherData = await Promise.all([queryPhotos(style.id), querySkus(style.id)]);
      const photos = otherData[0];
      const skus = otherData[1];

      return ({
        style_id: style.id,
        name: style.name,
        original_price: style.original_price.toFixed(2),
        sale_price: style.sale_price === 0 ? null : style.sale_price.toFixed(2),
        'default?': style.default_style === 1,
        photos,
        skus,
      });
    };

    styles
      .then((s) => Promise.all(s.rows.map(getStyleData)))
      .then((results) => {
        const returnData = {
          product_id: productId,
          results,
        };
        res.status(200).send(returnData);
      });
  } catch (err) {
    res.status(404).send(err.message);
  }
};

exports.getProduct = async (req, res) => {
  try {
    const productId = req.params.product_id;

    const results = await pool.query(`
    SELECT
      products.id,
      name,
      slogan,
      description,
      category,
      default_price,
      created_at,
      updated_at,
      feature,
      value
    FROM products
    INNER JOIN features
    ON products.id = features.product_id
    WHERE products.id = $1;`, [productId]);

    const features = [];

    results.rows.forEach((row) => {
      features.push({
        feature: row.feature,
        value: row.value,
      });
    });

    const returnData = {
      id: results.rows[0].id,
      campus: 'hr-sfo',
      name: results.rows[0].name,
      slogan: results.rows[0].slogan,
      description: results.rows[0].description,
      category: results.rows[0].category,
      default_price: results.rows[0].default_price.toFixed(2),
      created_at: results.rows[0].created_at,
      updated_at: results.rows[0].updated_at,
      features,
    };

    return res.status(200).send(returnData);
  } catch (err) {
    res.status(404).send(err.message);
  }
};

exports.getProducts = async (req, res) => {
  try {
    const page = req.query.page === undefined ? 1 : req.query.page;
    const count = req.query.count === undefined ? 5 : req.query.count;
    const offSet = (page - 1) * count + 1;
    const results = await pool.query('SELECT * FROM products LIMIT $1 OFFSET $2', [count, offSet]);

    const returnData = [];

    results.rows.forEach((row) => {
      const product = {
        id: row.id,
        campus: 'hr-sfo',
        name: row.name,
        slogan: row.slogan,
        description: row.description,
        category: row.category,
        default_price: row.default_price.toFixed(2),
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
      returnData.push(product);
    });

    res.status(200).send(returnData);
  } catch (err) {
    res.status(404).send(err.message);
  }
};