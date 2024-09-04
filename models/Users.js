module.exports = (sequelize, DataTypes) => {
  const Utilisateurs = sequelize.define("Utilisateurs", {
    Id_Utilisateur: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    Nom: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    Email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    Mot_De_Passe: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    Role: {
      type: DataTypes.STRING(25),
      allowNull: true,
    },
  }, {
    tableName: 'Utilisateurs',
    timestamps: false,
  });

  Utilisateurs.associate = (models) => {
    Utilisateurs.hasMany(models.Animaux, {
      foreignKey: 'Id_Utilisateur',
      onDelete: 'CASCADE'
    });
  };

  return Utilisateurs;
};
