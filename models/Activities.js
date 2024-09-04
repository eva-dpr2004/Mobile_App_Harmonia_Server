module.exports = (sequelize, DataTypes) => {
  const Activites = sequelize.define("Activites", {
    Id_Activite: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    Id_Animal: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    Nom_Animal: { 
      type: DataTypes.STRING,
      allowNull: false
    },
    Date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    Debut_Activite: {
      type: DataTypes.TIME,
      allowNull: false
    },
    Fin_Activite: {
      type: DataTypes.TIME,
      allowNull: false
    },
    Duree_Activite: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: 'Activites',
    timestamps: false
  });

  Activites.associate = (models) => {
    Activites.belongsTo(models.Animaux, {
      foreignKey: 'Id_Animal',
      onDelete: 'CASCADE'
    });
  };

  return Activites;
};
